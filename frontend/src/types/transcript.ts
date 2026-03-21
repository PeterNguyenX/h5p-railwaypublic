export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export type TranscriptFormat = 'vtt' | 'srt';

export interface ParsedTranscriptResult {
  segments: TranscriptSegment[];
  format: TranscriptFormat;
}
