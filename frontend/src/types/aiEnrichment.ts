/**
 * TypeScript types for the AI H5P Enrichment feature.
 */

/** A parsed transcript segment from a .vtt or .srt file. */
export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

/** Parsed transcript response from the backend. */
export interface ParsedTranscriptResponse {
  segments: TranscriptSegment[];
  count: number;
  format: string;
  filename: string;
}

/** Supported H5P interaction types from AI analysis. */
export type H5PInteractionType =
  | 'MultiChoice'
  | 'TrueFalse'
  | 'FillBlanks'
  | 'Hotspot'
  | 'DragDrop';

/** Status of an individual AI suggestion. */
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected';

/** An AI-generated H5P insertion suggestion. */
export interface AISuggestion {
  id: string;
  timestamp: number;
  type: H5PInteractionType;
  h5pLibrary: string;
  config: Record<string, unknown>;
  reason: string;
  status: SuggestionStatus;
}

/** SSE event types from the streaming analysis endpoint. */
export type SSEEventType = 'progress' | 'chunk' | 'result' | 'usage' | 'error';

export interface SSEProgressEvent {
  type: 'progress';
  message: string;
}

export interface SSEChunkEvent {
  type: 'chunk';
  text: string;
}

export interface SSEResultEvent {
  type: 'result';
  suggestions: AISuggestion[];
}

export interface SSEUsageEvent {
  type: 'usage';
  inputTokens: number;
  outputTokens: number;
}

export interface SSEErrorEvent {
  type: 'error';
  message: string;
}

export type SSEEvent =
  | SSEProgressEvent
  | SSEChunkEvent
  | SSEResultEvent
  | SSEUsageEvent
  | SSEErrorEvent;

/** Analysis response (non-streaming). */
export interface AnalyzeResponse {
  suggestions: AISuggestion[];
  count: number;
  videoId: string;
  rawResponse?: string;
}

/** Injection result for a single suggestion. */
export interface InjectedItem {
  suggestionId: string;
  contentId: string;
  timestamp: number;
  type: string;
  library: string;
}

/** Injection error for a single suggestion. */
export interface InjectionError {
  suggestionId: string;
  error: string;
}

/** Response from POST /api/ai/inject. */
export interface InjectResponse {
  message: string;
  injected: InjectedItem[];
  errors: InjectionError[];
  video: {
    id: string;
    title: string;
    h5pContent: Array<{ contentId: string; timestamp: number; type: string }>;
  };
}

/** Visual diff status for re-run comparisons. */
export type DiffStatus = 'new' | 'unchanged' | 'modified' | 'removed';

/** A suggestion with diff metadata for re-run comparison. */
export interface DiffSuggestion extends AISuggestion {
  diffStatus: DiffStatus;
  previousId?: string;
  isHistorical?: boolean;
}
