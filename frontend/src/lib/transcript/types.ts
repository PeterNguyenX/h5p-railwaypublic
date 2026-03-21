import type { TranscriptSegment, TranscriptFormat } from '../../types/transcript';

export interface ParseTranscriptOptions {
  format?: TranscriptFormat;
}

export interface ParseTranscriptOutput {
  format: TranscriptFormat;
  segments: TranscriptSegment[];
}
