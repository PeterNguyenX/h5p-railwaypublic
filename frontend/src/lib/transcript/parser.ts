import type { TranscriptFormat, TranscriptSegment } from '../../types/transcript';
import type { ParseTranscriptOptions, ParseTranscriptOutput } from './types';

const TIMESTAMP_SEPARATOR = '-->';

function parseTimestamp(rawTimestamp: string): number {
  const cleaned = rawTimestamp.trim().replace(',', '.');
  const parts = cleaned.split(':');

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts.map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts.map(Number);
    return minutes * 60 + seconds;
  }

  throw new Error(`Invalid transcript timestamp: ${rawTimestamp}`);
}

function normalizeText(lines: string[]): string {
  return lines
    .map((line) => line.trim().replace(/<[^>]+>/g, ''))
    .filter(Boolean)
    .join(' ')
    .trim();
}

function detectFormat(content: string): TranscriptFormat {
  const trimmed = content.trim();

  if (trimmed.startsWith('WEBVTT')) {
    return 'vtt';
  }

  if (/^\d+\s*\r?\n/.test(trimmed)) {
    return 'srt';
  }

  if (/\d{2}:\d{2}:\d{2},\d{3}/.test(trimmed)) {
    return 'srt';
  }

  return 'vtt';
}

function parseVtt(content: string): TranscriptSegment[] {
  const lines = content.split(/\r?\n/);
  const segments: TranscriptSegment[] = [];
  let index = 0;

  while (index < lines.length && !lines[index].includes(TIMESTAMP_SEPARATOR)) {
    index += 1;
  }

  while (index < lines.length) {
    const current = lines[index].trim();

    if (!current.includes(TIMESTAMP_SEPARATOR)) {
      index += 1;
      continue;
    }

    const [startRaw, endRaw] = current
      .split(TIMESTAMP_SEPARATOR)
      .map((part) => part.trim().split(/\s+/)[0]);

    const start = parseTimestamp(startRaw);
    const end = parseTimestamp(endRaw);

    index += 1;
    const textLines: string[] = [];
    while (index < lines.length && lines[index].trim() !== '') {
      textLines.push(lines[index]);
      index += 1;
    }

    const text = normalizeText(textLines);
    if (text) {
      segments.push({ start, end, text });
    }

    index += 1;
  }

  return segments;
}

function parseSrt(content: string): TranscriptSegment[] {
  const blocks = content.trim().split(/\r?\n\r?\n/);

  return blocks
    .map((block) => {
      const lines = block.split(/\r?\n/);
      const timestampLine = lines.find((line) => line.includes(TIMESTAMP_SEPARATOR));

      if (!timestampLine) {
        return null;
      }

      const [startRaw, endRaw] = timestampLine.split(TIMESTAMP_SEPARATOR).map((part) => part.trim());
      const textLines = lines.slice(lines.indexOf(timestampLine) + 1);
      const text = normalizeText(textLines);

      if (!text) {
        return null;
      }

      return {
        start: parseTimestamp(startRaw),
        end: parseTimestamp(endRaw),
        text
      };
    })
    .filter((segment): segment is TranscriptSegment => Boolean(segment));
}

export function parseTranscript(content: string, options: ParseTranscriptOptions = {}): ParseTranscriptOutput {
  if (!content.trim()) {
    throw new Error('Transcript content cannot be empty');
  }

  const format = options.format ?? detectFormat(content);
  const segments = format === 'srt' ? parseSrt(content) : parseVtt(content);

  return { format, segments };
}

export { parseTimestamp, detectFormat };
