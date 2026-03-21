/**
 * Transcript Routes
 * POST /api/transcript/parse — Upload and parse a .vtt or .srt file
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const { parseTranscript, mergeSegments } = require('../services/transcriptParser');

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

module.exports = router;
