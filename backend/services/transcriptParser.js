/**
 * Transcript Parser Service
 * Parses .vtt and .srt subtitle files into structured segments.
 */

/**
 * Parse a timestamp string into seconds.
 * Handles both SRT format (HH:MM:SS,mmm) and VTT format (HH:MM:SS.mmm or MM:SS.mmm).
 * @param {string} timestamp
 * @returns {number} seconds
 */
function parseTimestamp(timestamp) {
  const cleaned = timestamp.trim().replace(',', '.');
  const parts = cleaned.split(':');

  if (parts.length === 3) {
    // HH:MM:SS.mmm
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    // MM:SS.mmm (VTT short format)
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }

  throw new Error(`Invalid timestamp format: "${timestamp}"`);
}

/**
 * Detect file format from content.
 * @param {string} content
 * @returns {'vtt' | 'srt'}
 */
function detectFormat(content) {
  const trimmed = content.trim();
  if (trimmed.startsWith('WEBVTT')) {
    return 'vtt';
  }
  // SRT files start with a number (cue index)
  if (/^\d+\s*\r?\n/.test(trimmed)) {
    return 'srt';
  }
  // Fallback: try to detect by timestamp format
  if (trimmed.includes('-->')) {
    // If it has commas in timestamps, it's SRT
    if (/\d{2}:\d{2}:\d{2},\d{3}/.test(trimmed)) {
      return 'srt';
    }
    return 'vtt';
  }
  throw new Error('Unable to detect subtitle format. Expected .vtt or .srt content.');
}

/**
 * Parse VTT content into segments.
 * @param {string} content
 * @returns {{ start: number, end: number, text: string }[]}
 */
function parseVTT(content) {
  const segments = [];
  // Remove WEBVTT header and optional metadata
  const lines = content.split(/\r?\n/);
  let i = 0;

  // Skip WEBVTT header line and any header metadata
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    // Look for timestamp line
    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->').map(s => s.trim().split(/\s+/)[0]);
      const start = parseTimestamp(startStr);
      const end = parseTimestamp(endStr);

      // Collect text lines until empty line or end of file
      const textLines = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '') {
        // Strip VTT tags like <b>, <i>, <c.classname>, etc.
        const cleanedLine = lines[i].trim().replace(/<[^>]+>/g, '');
        if (cleanedLine) {
          textLines.push(cleanedLine);
        }
        i++;
      }

      if (textLines.length > 0) {
        segments.push({ start, end, text: textLines.join(' ') });
      }
    } else {
      i++;
    }
  }

  return segments;
}

/**
 * Parse SRT content into segments.
 * @param {string} content
 * @returns {{ start: number, end: number, text: string }[]}
 */
function parseSRT(content) {
  const segments = [];
  // Split by double newlines to get individual cues
  const blocks = content.trim().split(/\r?\n\r?\n/);

  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/);
    if (lines.length < 2) continue;

    // Find the timestamp line (contains ' --> ')
    let timestampLineIndex = -1;
    for (let j = 0; j < lines.length; j++) {
      if (lines[j].includes('-->')) {
        timestampLineIndex = j;
        break;
      }
    }

    if (timestampLineIndex === -1) continue;

    const timestampLine = lines[timestampLineIndex];
    const [startStr, endStr] = timestampLine.split('-->').map(s => s.trim());
    const start = parseTimestamp(startStr);
    const end = parseTimestamp(endStr);

    // Everything after the timestamp line is text
    const textLines = lines
      .slice(timestampLineIndex + 1)
      .map(l => l.trim().replace(/<[^>]+>/g, ''))
      .filter(l => l.length > 0);

    if (textLines.length > 0) {
      segments.push({ start, end, text: textLines.join(' ') });
    }
  }

  return segments;
}

/**
 * Parse a subtitle file (VTT or SRT) into transcript segments.
 * @param {string} content - Raw file content
 * @param {string} [format] - Optional format override ('vtt' or 'srt')
 * @returns {{ start: number, end: number, text: string }[]}
 */
function parseTranscript(content, format) {
  if (!content || typeof content !== 'string') {
    throw new Error('Transcript content must be a non-empty string');
  }

  const detectedFormat = format || detectFormat(content);

  if (detectedFormat === 'vtt') {
    return parseVTT(content);
  } else if (detectedFormat === 'srt') {
    return parseSRT(content);
  } else {
    throw new Error(`Unsupported format: "${detectedFormat}". Expected "vtt" or "srt".`);
  }
}

/**
 * Merge adjacent segments with small time gaps into larger chunks.
 * Useful for creating context windows for AI analysis.
 * @param {{ start: number, end: number, text: string }[]} segments
 * @param {number} [maxGapSeconds=2] - Maximum gap between segments to merge
 * @returns {{ start: number, end: number, text: string }[]}
 */
function mergeSegments(segments, maxGapSeconds = 2) {
  if (!segments || segments.length === 0) return [];

  const merged = [{ ...segments[0] }];

  for (let i = 1; i < segments.length; i++) {
    const current = segments[i];
    const last = merged[merged.length - 1];

    if (current.start - last.end <= maxGapSeconds) {
      last.end = current.end;
      last.text += ' ' + current.text;
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

module.exports = {
  parseTranscript,
  parseTimestamp,
  detectFormat,
  parseVTT,
  parseSRT,
  mergeSegments
};
