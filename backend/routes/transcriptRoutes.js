/**
 * Transcript Routes
 * POST /api/transcript/parse — Upload and parse a .vtt or .srt file
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const { parseTranscript, mergeSegments } = require('../services/transcriptParser');
const { Video } = require('../models');
const { getSegmentsFromCaptions, fetchYoutubeTranscriptSegments } = require('../services/transcriptExtraction');

// Multer config: store file in memory (subtitles are small)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    if (ext.endsWith('.vtt') || ext.endsWith('.srt')) {
      cb(null, true);
    } else {
      cb(new Error('Only .vtt and .srt files are accepted'));
    }
  }
});

/**
 * POST /api/transcript/parse
 * Body: multipart form with a "file" field
 * Query params:
 *   - merge (boolean): if true, merge adjacent segments (default: false)
 *   - maxGap (number): max gap in seconds for merging (default: 2)
 * Response: { segments: TranscriptSegment[], count: number }
 */
router.post('/parse', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Expected a .vtt or .srt file.' });
    }

    const content = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname.toLowerCase();

    // Detect format from extension or content
    let format;
    if (filename.endsWith('.vtt')) {
      format = 'vtt';
    } else if (filename.endsWith('.srt')) {
      format = 'srt';
    }

    let segments = parseTranscript(content, format);

    // Optionally merge adjacent segments
    if (req.query.merge === 'true') {
      const maxGap = parseFloat(req.query.maxGap) || 2;
      segments = mergeSegments(segments, maxGap);
    }

    res.json({
      segments,
      count: segments.length,
      format: format || 'auto-detected',
      filename: req.file.originalname
    });
  } catch (error) {
    console.error('Error parsing transcript:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/transcript/extract/:videoId
 * Extract transcript segments with timestamps from an existing video record.
 * Priority:
 * 1) Existing video.captions payload
 * 2) YouTube caption track (for imported YouTube videos)
 */
router.post('/extract/:videoId', auth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findOne({
      where: {
        id: videoId,
        userId: req.user.id,
      },
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    let segments = getSegmentsFromCaptions(video.captions);
    let source = 'captions';

    // Try YouTube captions if no local captions
    if (segments.length === 0 && video.youtubeUrl) {
      console.log(`Attempting to extract captions from YouTube URL: ${video.youtubeUrl}`);
      try {
        const extracted = await fetchYoutubeTranscriptSegments(video.youtubeUrl);
        segments = extracted.segments;
        source = 'youtube';

        if (segments.length > 0) {
          console.log(`Successfully extracted ${segments.length} segments from YouTube`);
          await video.update({
            captions: {
              source: 'youtube',
              languageCode: extracted.languageCode,
              segments,
            },
          });
        } else {
          console.warn(`No captions found on YouTube video`);
        }
      } catch (youtubeError) {
        console.error('Error extracting from YouTube:', youtubeError.message);
        // Don't fail - just continue without YouTube captions
      }
    }

    // If still no segments, try to provide a helpful workaround
    if (segments.length === 0) {
      // Check if demo mode is requested via query param (for testing)
      if (req.query.demo === 'true' || req.query.useFallback === 'true') {
        console.log('No captions found - generating demo/fallback transcript for testing');
        const duration = video.duration || 300; // Default 5 minutes
        const interval = 20; // Demo segments every 20 seconds
        const demoTexts = [
          'Welcome to this educational video. Today we will explore important concepts.',
          'Let us begin with an overview of the fundamental principles of this subject.',
          'The first key concept to understand is how these elements interact together.',
          'Research shows that understanding these patterns improves learning outcomes.',
          'Now let us examine practical applications of what we discussed so far.',
          'Active engagement with content significantly improves information retention.',
          'The second major concept involves the relationship between theory and practice.',
          'Consider how these principles apply to real-world scenarios you may encounter.',
          'This brings us to important conclusions about the overall topic.',
          'In summary, we have covered key ideas and their practical implications.',
        ];
        for (let t = 0; t < duration; t += interval) {
          const idx = Math.floor(t / interval) % demoTexts.length;
          segments.push({ 
            start: t, 
            end: Math.min(t + interval, duration), 
            text: demoTexts[idx] 
          });
        }
        source = 'demo_fallback';
        console.log(`Generated ${segments.length} demo segments for testing`);
        return res.json({
          segments,
          count: segments.length,
          source,
          videoId: video.id,
          note: 'Using demo transcript for testing - upload a real transcript file for production use',
        });
      }

      // No demo mode - provide helpful error with suggestions
      const suggestions = [];
      if (video.youtubeUrl) {
        suggestions.push('- The YouTube video may not have captions available');
        suggestions.push('- Upload a .vtt or .srt transcript file instead');
        suggestions.push('- Or add ?demo=true to this request to use a demo transcript (testing only)');
      } else if (video.filePath) {
        suggestions.push('- For uploaded videos, call POST /api/transcript/whisper/{videoId} to auto-transcribe');
        suggestions.push('- Or upload a .vtt or .srt transcript file');
      } else {
        suggestions.push('- Upload a .vtt or .srt transcript file');
      }
      return res.status(400).json({
        error: 'No transcript/caption data found for this video',
        videoType: video.youtubeUrl ? 'youtube' : 'uploaded',
        suggestions,
      });
    }

    return res.json({
      segments,
      count: segments.length,
      source,
      videoId: video.id,
    });
  } catch (error) {
    console.error('Error extracting transcript:', error.message);
    return res.status(500).json({ 
      error: 'Failed to extract transcript',
      details: error.message 
    });
  }
});

/**
 * POST /api/transcript/whisper/:videoId
 * Automatically extract audio from an uploaded video and transcribe with Whisper.
 * Falls back to a demo transcript if OPENAI_API_KEY is not configured.
 */
router.post('/whisper/:videoId', auth, async (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const { execFile } = require('child_process');
  const { promisify } = require('util');
  const execFileAsync = promisify(execFile);

  try {
    const { videoId } = req.params;
    const video = await Video.findOne({ where: { id: videoId, userId: req.user.id } });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    let videoFilePath;
    let tempAudioPath = null;

    if (video.filePath) {
      videoFilePath = path.resolve(__dirname, '..', video.filePath);
      if (!fs.existsSync(videoFilePath)) {
        return res.status(400).json({ error: 'Video file not found on server.' });
      }
    } else if (video.youtubeUrl || video.youtubeId) {
      // Download audio from YouTube using yt-dlp
      const ytUrl = video.youtubeUrl || `https://www.youtube.com/watch?v=${video.youtubeId}`;
      const tmpDir = path.join(__dirname, '..', 'uploads', 'tmp');
      fs.mkdirSync(tmpDir, { recursive: true });
      tempAudioPath = path.join(tmpDir, `yt_${video.id}.mp3`);
      // Resolve ffmpeg location cross-platform: prefer env var, then PATH
      const ffmpegBinFromEnv = process.env.FFMPEG_BIN_DIR || '';
      let ffmpegArgs = [];
      if (ffmpegBinFromEnv && fs.existsSync(ffmpegBinFromEnv)) {
        ffmpegArgs = ['--ffmpeg-location', ffmpegBinFromEnv];
      }

      // Resolve yt-dlp binary cross-platform
      // Check .venv inside the project root (pip install yt-dlp adds it there)
      const venvYtDlpUnix = path.join(__dirname, '..', '..', '.venv', 'bin', 'yt-dlp');
      const venvYtDlpWin  = path.join(__dirname, '..', '..', '.venv', 'Scripts', 'yt-dlp.exe');
      const ytDlpCandidates = process.platform === 'win32'
        ? [
            process.env.YTDLP_BIN || '',
            venvYtDlpWin,
            'C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\yt-dlp.exe',
            'yt-dlp.exe',
          ]
        : [
            process.env.YTDLP_BIN || '',
            venvYtDlpUnix,
            '/usr/local/bin/yt-dlp',
            '/opt/homebrew/bin/yt-dlp',
            'yt-dlp',
          ];
      const ytDlpBin = ytDlpCandidates.find(p => p && fs.existsSync(p)) || 'yt-dlp';

      try {
        await execFileAsync(ytDlpBin, [
          '-x', '--audio-format', 'mp3',
          ...ffmpegArgs,
          '-o', tempAudioPath,
          '--no-playlist',
          ytUrl
        ], { timeout: 5 * 60 * 1000 });
      } catch (dlErr) {
        const msg = dlErr.message || '';
        let hint = '';
        if (msg.includes('ffprobe and ffmpeg not found') || msg.includes('ffmpeg-location') || msg.includes('ffmpeg not found')) {
          hint = ' — ffmpeg is not installed or not on PATH. Install it (Mac: brew install ffmpeg, Windows: winget install Gyan.FFmpeg) then restart the server. Or set FFMPEG_BIN_DIR in backend/.env to the folder containing ffmpeg.';
        } else if (msg.includes('yt-dlp') || msg.includes('not found') || msg.includes('No such file')) {
          hint = ' — yt-dlp is not installed or not on PATH. Install it (Mac: brew install yt-dlp, Windows: winget install yt-dlp) then restart the server.';
        } else if (msg.includes('JavaScript runtime')) {
          hint = ' — yt-dlp needs a JavaScript runtime (Node.js or Deno). Make sure Node.js is on PATH and restart the server.';
        }
        console.error('yt-dlp download failed:', msg);
        return res.status(500).json({ error: 'Failed to download YouTube audio' + hint });
      }
      videoFilePath = tempAudioPath;
    } else {
      return res.status(400).json({ error: 'No video source available for transcription.' });
    }

    const scriptPath = path.join(__dirname, '..', 'scripts', 'whisper_transcribe.py');
    const modelSize = req.query.model || 'base';
    // Optional explicit language (e.g. "vi", "en"). Blank = auto-detect.
    const langHint = req.query.lang || '';

    // Prefer the project .venv Python which has faster-whisper installed
    const venvPythonUnix = path.join(__dirname, '..', '..', '.venv', 'bin', 'python3');
    const venvPythonWin = path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe');
    const systemPythonWin = 'C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python311\\python.exe';
    const pythonBin = fs.existsSync(venvPythonWin) ? venvPythonWin
      : fs.existsSync(venvPythonUnix) ? venvPythonUnix
      : fs.existsSync(systemPythonWin) ? systemPythonWin
      : process.platform === 'win32' ? 'python' : 'python3';

    // Run faster-whisper via Python script
    let segments = [];
    let source = 'faster-whisper';
    let language = null;

    try {
      const whisperArgs = [scriptPath, videoFilePath, modelSize];
      if (langHint) whisperArgs.push(langHint);
      const { stdout } = await execFileAsync(pythonBin, whisperArgs, {
        timeout: 10 * 60 * 1000, // 10 minute max
        maxBuffer: 10 * 1024 * 1024,
      });

      const result = JSON.parse(stdout.trim());
      if (result.error) throw new Error(result.error);

      segments = result.segments || [];
      language = result.language || null;
      console.log(`faster-whisper transcribed ${segments.length} segments (lang: ${language})`);
    } catch (whisperErr) {
      console.error('faster-whisper failed:', whisperErr.message);
      return res.status(500).json({
        error: 'faster-whisper transcription failed: ' + whisperErr.message,
        hint: 'Make sure faster-whisper is installed: pip install faster-whisper',
      });
    }

    // Cache segments on video record
    await video.update({
      captions: { source, language, segments },
    });

    // Clean up temp YouTube audio download
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      fs.unlink(tempAudioPath, () => {});
    }

    return res.json({
      segments,
      count: segments.length,
      source,
      language,
      message: `Transcribed ${segments.length} segments using faster-whisper (${modelSize} model)`,
    });
  } catch (error) {
    console.error('Error in Whisper transcription:', error.message);
    return res.status(500).json({ error: error.message || 'Transcription failed' });
  }
});

module.exports = router;
