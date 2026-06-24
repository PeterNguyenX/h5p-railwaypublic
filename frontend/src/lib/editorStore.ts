import { create } from 'zustand';
import type { AISuggestion, TranscriptSegment, Video, H5PContent, TopicNode, TopicQuestion } from '../lib/api';
import { streamAnalysis, injectSuggestions, fetchH5PContent, deleteH5PContent, deleteAllH5PContent } from '../lib/api';

const WINDOW_SIZE = 30; // seconds — min gap between H5P interactions

// Throttle: only push progress updates to the store every 300ms during chunk streaming.
// This prevents hundreds of React re-renders while the AI streams tokens.
let lastChunkUpdate = 0;

const H5P_TYPE_MAP: Record<string, string> = {
  MultiChoice: 'H5P.MultiChoice 1.16',
  TrueFalse: 'H5P.TrueFalse 1.6',
  FillBlanks: 'H5P.Blanks 1.14',
  DragText: 'H5P.DragText 1.10',
  MarkWords: 'H5P.MarkWords 1.9',
  Matching: 'H5P.Matching 1.0',
};

function buildSuggestion(question: TopicQuestion, timestamp: number, nodeTitle: string): AISuggestion {
  const id = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let config: Record<string, unknown>;

  if (question.type === 'MultiChoice') {
    config = { question: question.question, answers: question.answers, feedback: question.feedback };
  } else if (question.type === 'TrueFalse') {
    config = { question: question.question, correct: question.correct ? 'true' : 'false', feedback: question.feedback };
  } else if (question.type === 'DragText') {
    config = { taskDescription: question.taskDescription, textField: question.textField, feedback: question.feedback };
  } else if (question.type === 'MarkWords') {
    config = { taskDescription: question.taskDescription, textField: question.textField, feedback: question.feedback };
  } else if (question.type === 'Matching') {
    config = { taskDescription: question.taskDescription, pairs: question.pairs, feedback: question.feedback };
  } else {
    // FillBlanks
    config = { text: question.fillText, showSolutions: 'end', autoCheck: false, feedback: question.feedback };
  }

  return {
    id,
    timestamp,
    type: question.type as AISuggestion['type'],
    h5pLibrary: H5P_TYPE_MAP[question.type] || '',
    config,
    reason: `Generated for: ${nodeTitle}`,
    status: 'accepted',
  };
}

function questionHasText(q: TopicQuestion): boolean {
  return !!(q.question?.trim() || q.fillText?.trim() || q.taskDescription?.trim() || q.textField?.trim() || q.pairs?.length);
}

function extractSuggestions(topics: TopicNode[], existingTimestamps: number[], videoDuration?: number): AISuggestion[] {
  const allUsedTimestamps = [...existingTimestamps];
  const suggestions: AISuggestion[] = [];

  for (const topic of topics) {
    if (!topic.question || !questionHasText(topic.question)) continue;
    const wantedTs = Math.round(topic.end) + 1;
    if (allUsedTimestamps.some((t) => Math.abs(t - wantedTs) < WINDOW_SIZE)) continue;
    if (videoDuration && wantedTs >= videoDuration - 2) continue;
    allUsedTimestamps.push(wantedTs);
    suggestions.push(buildSuggestion(topic.question, wantedTs, topic.title));
  }

  return suggestions.sort((a, b) => a.timestamp - b.timestamp);
}

interface EditorStore {
  video: Video | null;
  setVideo: (v: Video | null) => void;

  h5pContents: H5PContent[];
  setH5pContents: (c: H5PContent[]) => void;
  loadH5PContents: (videoId: string) => Promise<void>;
  removeH5PContent: (id: string) => Promise<void>;
  clearAllH5PContents: (videoId: string) => Promise<void>;

  segments: TranscriptSegment[];
  setSegments: (s: TranscriptSegment[]) => void;
  transcriptFilename: string | null;
  setTranscriptFilename: (n: string | null) => void;

  topics: TopicNode[];
  setTopics: (t: TopicNode[]) => void;

  suggestions: AISuggestion[];
  isAnalyzing: boolean;
  analysisProgress: number; // 0-100
  progressMessage: string;
  analyzeError: string | null;
  runAnalysis: (videoId: string, language?: string) => () => void;
  resetAnalysis: () => void;
  resetEditor: () => void;

  isInjecting: boolean;
  injectProgress: number; // 0-100
  injectError: string | null;
  lastInjectCount: number;
  injectAccepted: (videoId: string) => Promise<void>;

  currentTime: number;
  setCurrentTime: (t: number) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  video: null,
  setVideo: (v) => set({ video: v }),

  h5pContents: [],
  setH5pContents: (c) => set({ h5pContents: c }),
  loadH5PContents: async (videoId) => {
    try {
      const contents = await fetchH5PContent(videoId);
      set({ h5pContents: Array.isArray(contents) ? contents : [] });
    } catch {
      set({ h5pContents: [] });
    }
  },
  removeH5PContent: async (id) => {
    await deleteH5PContent(id);
    set((state) => ({ h5pContents: state.h5pContents.filter((c) => c.id !== id) }));
  },
  clearAllH5PContents: async (videoId) => {
    const preserved = await deleteAllH5PContent(videoId);
    set({ h5pContents: preserved });
  },

  segments: [],
  setSegments: (s) => set({ segments: s }),
  transcriptFilename: null,
  setTranscriptFilename: (n) => set({ transcriptFilename: n }),

  topics: [],
  setTopics: (t) => set({ topics: t }),

  suggestions: [],
  isAnalyzing: false,
  analysisProgress: 0,
  progressMessage: '',
  analyzeError: null,

  runAnalysis: (videoId: string, language = 'en') => {
    const { segments } = get();
    if (!segments.length) {
      set({ analyzeError: 'Please upload a transcript first.' });
      return () => {};
    }

    set({ isAnalyzing: true, analyzeError: null, progressMessage: 'Connecting to AI...', analysisProgress: 5 });
    lastChunkUpdate = 0;

    const cleanup = streamAnalysis(segments, videoId, (event) => {
      switch (event.type) {
        case 'queued':
          set({ progressMessage: (event as { type: string; message?: string }).message ?? 'Waiting in queue…', analysisProgress: 3 });
          break;

        case 'progress':
          set((s) => ({
            progressMessage: event.message,
            analysisProgress: event.percent ?? Math.min(75, s.analysisProgress + 12),
          }));
          break;

        case 'chunk': {
          // Throttle to one store update per 300ms — the AI may stream 500+ tokens;
          // without this every token re-renders the entire Editor component.
          const now = Date.now();
          if (now - lastChunkUpdate >= 300) {
            lastChunkUpdate = now;
            set((s) => ({
              progressMessage: 'AI is generating questions...',
              analysisProgress: event.percent ?? Math.min(85, s.analysisProgress + 1),
            }));
          }
          break;
        }

        case 'result': {
          const topics = (event as { type: string; topics?: TopicNode[] }).topics ?? [];
          const rawDuration = get().video?.duration as string | number | undefined;
          const videoDurationSec = typeof rawDuration === 'number'
            ? rawDuration
            : typeof rawDuration === 'string'
              ? rawDuration.split(':').reduce((acc, part, i, arr) => acc + parseInt(part) * Math.pow(60, arr.length - 1 - i), 0)
              : undefined;
          const suggestions = extractSuggestions(topics, [], videoDurationSec);

          set({
            topics,
            suggestions,
            analysisProgress: 90,
            progressMessage: `Applying ${suggestions.length} interactions...`,
          });

          get().injectAccepted(videoId).then(() => {
            set({ isAnalyzing: false, analysisProgress: 100, progressMessage: `Done! ${suggestions.length} interactions added.` });
            setTimeout(() => set({ analysisProgress: 0, progressMessage: '' }), 2500);
          }).catch((err: unknown) => {
            set({
              isAnalyzing: false,
              analysisProgress: 0,
              progressMessage: '',
              analyzeError: err instanceof Error ? err.message : 'Injection failed',
            });
          });
          break;
        }

        case 'error':
          set({ analyzeError: event.message, isAnalyzing: false, analysisProgress: 0, progressMessage: '' });
          break;
      }
    }, language);

    return cleanup;
  },

  resetAnalysis: () => set({ suggestions: [], progressMessage: '', analyzeError: null, analysisProgress: 0, isAnalyzing: false }),

  resetEditor: () => set({
    video: null,
    h5pContents: [],
    segments: [],
    transcriptFilename: null,
    topics: [],
    suggestions: [],
    isAnalyzing: false,
    analysisProgress: 0,
    progressMessage: '',
    analyzeError: null,
    isInjecting: false,
    injectProgress: 0,
    injectError: null,
    lastInjectCount: 0,
    currentTime: 0,
  }),

  isInjecting: false,
  injectProgress: 0,
  injectError: null,
  lastInjectCount: 0,

  injectAccepted: async (videoId) => {
    const accepted = get().suggestions.filter((s) => s.status === 'accepted');
    if (!accepted.length) return;

    set({ isInjecting: true, injectError: null, injectProgress: 50 });

    try {
      const result = await injectSuggestions(accepted, videoId);
      const injectedIds = new Set(result.injected.map((i) => i.suggestionId));
      set((s) => ({
        isInjecting: false,
        injectProgress: 100,
        lastInjectCount: result.injected.length,
        suggestions: s.suggestions.filter((sg) => !injectedIds.has(sg.id)),
      }));
      setTimeout(() => set({ injectProgress: 0 }), 800);
      await get().loadH5PContents(videoId);
    } catch (err: unknown) {
      set({ isInjecting: false, injectError: err instanceof Error ? err.message : 'Injection failed', injectProgress: 0 });
    }
  },

  currentTime: 0,
  setCurrentTime: (t) => set({ currentTime: t }),
}));
