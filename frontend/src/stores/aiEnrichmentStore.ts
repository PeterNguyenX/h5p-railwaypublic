import { makeAutoObservable, runInAction } from 'mobx';
import axios from 'axios';
import type {
  TranscriptSegment,
  AISuggestion,
  SuggestionStatus,
  DiffSuggestion,
  DiffStatus,
  InjectResponse
} from '../types/aiEnrichment';
import { analyzeTranscript } from '../lib/ai/analyzeTranscript';
import { injectSuggestions } from '../lib/h5p/inject';

/**
 * MobX store for managing AI-powered H5P enrichment state.
 */
class AiEnrichmentStore {
  /** Parsed transcript segments */
  segments: TranscriptSegment[] = [];

  /** Current AI-generated suggestions */
  suggestions: AISuggestion[] = [];

  /** Previous suggestions (for diff comparison on re-run) */
  previousSuggestions: AISuggestion[] = [];

  /** Whether AI analysis is in progress */
  isAnalyzing = false;

  /** Progress message from SSE stream */
  progressMessage = '';

  /** Raw streamed text (for debugging) */
  streamedText = '';

  /** Raw AI response payload (non-streaming or streaming aggregate) */
  rawAiResponse = '';

  /** Error message from last operation */
  error: string | null = null;

  /** Whether injection is in progress */
  isInjecting = false;

  /** Last injection result */
  lastInjectionResult: InjectResponse | null = null;

  /** Current video ID being enriched */
  videoId: string | null = null;

  /** Filename of uploaded transcript */
  transcriptFilename: string | null = null;

  /** Current video timestamp (synced with player) */
  currentTime = 0;

  constructor() {
    makeAutoObservable(this);
  }

  /** Get only accepted suggestions */
  get acceptedSuggestions(): AISuggestion[] {
    return this.suggestions.filter(s => s.status === 'accepted');
  }

  /** Get only pending suggestions */
  get pendingSuggestions(): AISuggestion[] {
    return this.suggestions.filter(s => s.status === 'pending');
  }

  /** Get only rejected suggestions */
  get rejectedSuggestions(): AISuggestion[] {
    return this.suggestions.filter(s => s.status === 'rejected');
  }

  /** Get suggestions with diff metadata for re-run comparison */
  get diffSuggestions(): DiffSuggestion[] {
    if (this.previousSuggestions.length === 0) {
      return this.suggestions.map(s => ({ ...s, diffStatus: 'new' as DiffStatus }));
    }

    const currentWithDiff = this.suggestions.map(suggestion => {
      // Find closest previous suggestion by timestamp (within 5 seconds)
      const previous = this.previousSuggestions.find(
        prev => Math.abs(prev.timestamp - suggestion.timestamp) < 5 && prev.type === suggestion.type
      );

      let diffStatus: DiffStatus = 'new';
      if (previous) {
        const configChanged = JSON.stringify(previous.config) !== JSON.stringify(suggestion.config);
        diffStatus = configChanged ? 'modified' : 'unchanged';
      }

      return { ...suggestion, diffStatus, previousId: previous?.id };
    });

    // Previous suggestions not present in current run are marked as removed.
    const removed = this.previousSuggestions
      .filter(prev => {
        return !this.suggestions.some(
          current => Math.abs(prev.timestamp - current.timestamp) < 5 && prev.type === current.type
        );
      })
      .map(prev => ({
        ...prev,
        id: `${prev.id}_removed`,
        status: 'rejected' as SuggestionStatus,
        diffStatus: 'removed' as DiffStatus,
        previousId: prev.id,
        isHistorical: true
      }));

    return [...currentWithDiff, ...removed];
  }

  /** Set the video ID for this enrichment session */
  setVideoId(videoId: string) {
    this.videoId = videoId;
  }

  /** Update current playback time */
  setCurrentTime(time: number) {
    this.currentTime = time;
  }

  /**
   * Upload and parse a transcript file.
   */
  async parseTranscript(file: File): Promise<void> {
    this.error = null;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/transcript/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      runInAction(() => {
        this.segments = response.data.segments;
        this.transcriptFilename = response.data.filename;
      });
    } catch (err: unknown) {
      runInAction(() => {
        if (axios.isAxiosError(err)) {
          this.error = err.response?.data?.error || err.message;
        } else if (err instanceof Error) {
          this.error = err.message;
        } else {
          this.error = 'Failed to parse transcript';
        }
      });
    }
  }

  /**
   * Run AI analysis on current segments (non-streaming).
   */
  async analyzeNonStreaming(): Promise<void> {
    if (!this.videoId || this.segments.length === 0) {
      this.error = 'No video ID or transcript segments available';
      return;
    }

    this.isAnalyzing = true;
    this.error = null;
    this.progressMessage = 'Starting AI analysis...';

    // Store previous suggestions for diff
    if (this.suggestions.length > 0) {
      this.previousSuggestions = [...this.suggestions];
    }

    try {
      const response = await analyzeTranscript(this.videoId, this.segments);

      runInAction(() => {
        this.suggestions = response.suggestions;
        this.rawAiResponse = response.rawResponse || '';
        this.isAnalyzing = false;
        this.progressMessage = '';
      });
    } catch (err: unknown) {
      runInAction(() => {
        this.isAnalyzing = false;
        this.progressMessage = '';
        if (axios.isAxiosError(err)) {
          this.error = err.response?.data?.error || err.message;
        } else if (err instanceof Error) {
          this.error = err.message;
        } else {
          this.error = 'AI analysis failed';
        }
      });
    }
  }

  /**
   * Run AI analysis with SSE streaming.
   */
  async analyzeStreaming(): Promise<void> {
    if (!this.videoId || this.segments.length === 0) {
      this.error = 'No video ID or transcript segments available';
      return;
    }

    this.isAnalyzing = true;
    this.error = null;
    this.streamedText = '';
    this.rawAiResponse = '';
    this.progressMessage = 'Starting AI analysis...';

    // Store previous suggestions for diff
    if (this.suggestions.length > 0) {
      this.previousSuggestions = [...this.suggestions];
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/analyze-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ segments: this.segments, videoId: this.videoId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Streaming analysis failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';

      if (!reader) {
        throw new Error('No readable stream available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const events = sseBuffer.split('\n\n');
        sseBuffer = events.pop() || '';

        for (const eventBlock of events) {
          const dataLine = eventBlock
            .split('\n')
            .find((line) => line.startsWith('data: '));

          if (!dataLine) continue;

          const data = dataLine.slice(6);
          if (data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);
            runInAction(() => {
              switch (event.type) {
                case 'progress':
                  this.progressMessage = event.message;
                  break;
                case 'chunk':
                  this.streamedText += event.text;
                  this.rawAiResponse = this.streamedText;
                  this.progressMessage = 'AI is generating suggestions...';
                  break;
                case 'result':
                  this.suggestions = event.suggestions;
                  this.progressMessage = `Analysis complete — ${event.suggestions.length} suggestions generated`;
                  break;
                case 'error':
                  this.error = event.message;
                  break;
              }
            });
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      runInAction(() => {
        this.isAnalyzing = false;
      });
    } catch (err: unknown) {
      runInAction(() => {
        this.isAnalyzing = false;
        this.progressMessage = '';
        if (err instanceof Error) {
          this.error = err.message;
        } else {
          this.error = 'AI streaming analysis failed';
        }
      });
    }
  }

  /** Update a suggestion's status (accept/reject). */
  setSuggestionStatus(suggestionId: string, status: SuggestionStatus) {
    const index = this.suggestions.findIndex(s => s.id === suggestionId);
    if (index !== -1) {
      this.suggestions[index] = { ...this.suggestions[index], status };
    }
  }

  /** Accept all pending suggestions. */
  acceptAll() {
    this.suggestions = this.suggestions.map(s =>
      s.status === 'pending' ? { ...s, status: 'accepted' } : s
    );
  }

  /** Reject all pending suggestions. */
  rejectAll() {
    this.suggestions = this.suggestions.map(s =>
      s.status === 'pending' ? { ...s, status: 'rejected' } : s
    );
  }

  /** Update a suggestion's config (from the inline editor). */
  updateSuggestionConfig(suggestionId: string, config: Record<string, unknown>) {
    const index = this.suggestions.findIndex(s => s.id === suggestionId);
    if (index !== -1) {
      this.suggestions[index] = { ...this.suggestions[index], config };
    }
  }

  /** Remove rejected suggestions from the list. */
  removeRejected() {
    this.suggestions = this.suggestions.filter(s => s.status !== 'rejected');
  }

  /**
   * Inject accepted suggestions into H5P.
   */
  async injectAccepted(): Promise<void> {
    if (!this.videoId) {
      this.error = 'No video ID set';
      return;
    }

    const accepted = this.acceptedSuggestions;
    if (accepted.length === 0) {
      this.error = 'No accepted suggestions to inject';
      return;
    }

    this.isInjecting = true;
    this.error = null;

    try {
      const response = await injectSuggestions(this.videoId, accepted);

      runInAction(() => {
        this.lastInjectionResult = response;
        this.isInjecting = false;
        // Remove injected suggestions from the list
        const injectedIds = new Set(response.injected.map((i: { suggestionId: string }) => i.suggestionId));
        this.suggestions = this.suggestions.filter(s => !injectedIds.has(s.id));
      });
    } catch (err: unknown) {
      runInAction(() => {
        this.isInjecting = false;
        if (axios.isAxiosError(err)) {
          this.error = err.response?.data?.error || err.message;
        } else if (err instanceof Error) {
          this.error = err.message;
        } else {
          this.error = 'Injection failed';
        }
      });
    }
  }

  /** Clear all state (for cleanup on unmount). */
  reset() {
    this.segments = [];
    this.suggestions = [];
    this.previousSuggestions = [];
    this.isAnalyzing = false;
    this.progressMessage = '';
    this.streamedText = '';
    this.rawAiResponse = '';
    this.error = null;
    this.isInjecting = false;
    this.lastInjectionResult = null;
    this.videoId = null;
    this.transcriptFilename = null;
    this.currentTime = 0;
  }
}

const aiEnrichmentStore = new AiEnrichmentStore();
export default aiEnrichmentStore;
