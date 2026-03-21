import type { H5PType } from '../../types/h5p';

export interface AISuggestionInput {
  timestamp: number;
  type: H5PType;
  config: Record<string, unknown>;
  reason: string;
}

export interface AnalyzeTranscriptRequest {
  videoId: string;
  segments: Array<{ start: number; end: number; text: string }>;
}

export interface AnalyzeTranscriptResponse {
  suggestions: AISuggestionInput[];
  count: number;
  videoId: string;
  rawResponse?: string;
}
