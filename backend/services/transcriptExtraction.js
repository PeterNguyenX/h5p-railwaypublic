const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const os = require('os');
const path = require('path');

const execFileAsync = promisify(execFile);

function decodeHtmlEntities(text) {
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}

function extractYoutubeId(urlOrId) {
  if (!urlOrId) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  try {
    const url = new URL(urlOrId);
    return url.searchParams.get('v') || url.pathname.replace(/^\//, '') || null;
  } catch {
    return null;
  }
}

function normalizeSegments(rawSegments) {
  if (!Array.isArray(rawSegments)) return [];
  return rawSegments
    .map((item) => {
      const start = Number(item.start ?? item.startTime ?? item.from);
      const end = Number(
        item.end ?? item.endTime ?? item.to ??
        (Number.isFinite(start) ? start + Number(item.duration || 0) : NaN)
      );
      const text = String(item.text ?? item.caption ?? item.value ?? '').trim();
      if (!Number.isFinite(start) || !Number.isFinite(end) || !text) return null;
      return { start: Math.max(0, start), end: Math.max(start, end), text };
    })
    .filter(Boolean);
}

function getSegmentsFromCaptions(captions) {
  if (!captions) return [];
  if (Array.isArray(captions)) return normalizeSegments(captions);
  if (Array.isArray(captions.segments)) return normalizeSegments(captions.segments);
  if (Array.isArray(captions.cues)) return normalizeSegments(captions.cues);
  if (Array.isArray(captions.items)) return normalizeSegments(captions.items);
  return [];
}

/**
 * Parse yt-dlp json3 subtitle format into transcript segments.
 */
function parseJson3Subtitles(json3) {
  const events = json3.events || [];
  const segments = [];

  for (const evt of events) {
    if (!evt.segs || !Array.isArray(evt.segs)) continue;
    const text = evt.segs
      .map((s) => s.utf8 || '')
      .join('')
      .replace(/\n/g, ' ')
      .trim();
    if (!text || text === '[Music]' || text === '[Applause]') continue;

    const start = (evt.tStartMs || 0) / 1000;
    const dur = (evt.dDurationMs || 3000) / 1000;
    segments.push({
      start,
      end: start + Math.min(dur, 10), // cap at 10s per segment
      text: decodeHtmlEntities(text),
    });
  }

  return segments;
}

/**
 * Fetch YouTube transcript using yt-dlp (free, no API key).
 * Requires yt-dlp to be installed on the system (pip install yt-dlp).
 */
async function fetchYoutubeTranscriptSegments(youtubeUrl) {
  const videoId = extractYoutubeId(youtubeUrl);
  if (!videoId) {
    console.warn('Could not extract YouTube video ID from:', youtubeUrl);
    return { segments: [], languageCode: null };
  }

  const tmpDir = os.tmpdir();
  const tmpBase = path.join(tmpDir, `yt_transcript_${videoId}_${Date.now()}`);
  const tmpOut = `${tmpBase}.en.json3`;

  try {
    // Find yt-dlp binary
    let ytdlpPath = 'yt-dlp';
    try {
      const { stdout } = await execFileAsync('which', ['yt-dlp']);
      ytdlpPath = stdout.trim();
    } catch {
      // use default
    }

    await execFileAsync(ytdlpPath, [
      '--write-auto-subs',
      '--write-subs',
      '--sub-lang', 'en',
      '--skip-download',
      '--sub-format', 'json3',
      '--no-playlist',
      '-o', tmpBase,
      `https://www.youtube.com/watch?v=${videoId}`,
    ], { timeout: 60000 });

    if (!fs.existsSync(tmpOut)) {
      // Try auto-generated subs path
      const autoOut = `${tmpBase}.en-orig.json3`;
      if (fs.existsSync(autoOut)) {
        fs.renameSync(autoOut, tmpOut);
      } else {
        console.warn('yt-dlp did not produce subtitle file for video:', videoId);
        return { segments: [], languageCode: null };
      }
    }

    const json3 = JSON.parse(fs.readFileSync(tmpOut, 'utf8'));
    const segments = parseJson3Subtitles(json3);

    console.log(`Extracted ${segments.length} segments from YouTube via yt-dlp (lang: en)`);
    return { segments, languageCode: 'en' };
  } catch (err) {
    console.warn('yt-dlp transcript extraction failed:', err.message);
    return { segments: [], languageCode: null };
  } finally {
    // Cleanup temp files
    for (const ext of ['.en.json3', '.en-orig.json3', '.info.json']) {
      const f = `${tmpBase}${ext}`;
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  }
}

module.exports = {
  getSegmentsFromCaptions,
  fetchYoutubeTranscriptSegments,
};
