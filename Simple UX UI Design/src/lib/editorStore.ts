import { create } from 'zustand';
import type { AISuggestion, TranscriptSegment, Video, H5PContent } from '../lib/api';
import { streamAnalysis, injectSuggestions, fetchH5PContent, deleteH5PContent } from '../lib/api';

interface EditorStore {
  // Current video
  video: Video | null;
  setVideo: (v: Video | null) => void;

  // H5P content list
  h5pContents: H5PContent[];
  setH5pContents: (c: H5PContent[]) => void;
  loadH5PContents: (videoId: string) => Promise<void>;
  removeH5PContent: (id: string) => Promise<void>;

  // Transcript
  segments: TranscriptSegment[];
  setSegments: (s: TranscriptSegment[]) => void;
  transcriptFilename: string | null;
  setTranscriptFilename: (n: string | null) => void;

  // AI analysis
  suggestions: AISuggestion[];
  previousSuggestions: AISuggestion[];
  isAnalyzing: boolean;
  progressMessage: string;
  streamedText: string;
  analyzeError: string | null;
  runAnalysis: (videoId: string) => () => void;
  resetAnalysis: () => void;

  // Suggestion management
  setSuggestionStatus: (id: string, status: AISuggestion['status']) => void;
  updateSuggestionConfig: (id: string, config: Record<string, unknown>) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  removeRejected: () => void;

  // Injection
  isInjecting: boolean;
  injectError: string | null;
  lastInjectCount: number;
  injectAccepted: (videoId: string) => Promise<void>;

  // Playback sync
  currentTime: number;
  setCurrentTime: (t: number) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  // Video
  video: null,
  setVideo: (v) => set({ video: v }),

  // H5P content
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

  // Transcript
  segments: [],
  setSegments: (s) => set({ segments: s }),
  transcriptFilename: null,
  setTranscriptFilename: (n) => set({ transcriptFilename: n }),

  // AI
  suggestions: [],
  previousSuggestions: [],
  isAnalyzing: false,
  progressMessage: '',
  streamedText: '',
  analyzeError: null,

  runAnalysis: (videoId: string) => {
    const { segments, suggestions } = get();
    if (!segments.length) {
      set({ analyzeError: 'Please upload a transcript file first.' });
      return () => {};
    }

    // Save previous suggestions for diff
    if (suggestions.length > 0) {
      set({ previousSuggestions: suggestions });
    }

    set({ isAnalyzing: true, analyzeError: null, streamedText: '', progressMessage: 'Connecting to AI...' });

    const cleanup = streamAnalysis(segments, videoId, (event) => {
      switch (event.type) {
        case 'progress':
          set({ progressMessage: event.message });
          break;
        case 'chunk':
          set((s) => ({ streamedText: s.streamedText + event.text, progressMessage: 'AI is thinking...' }));
          break;
        case 'result': {
          // Auto-accept all suggestions immediately
          const autoAccepted = event.suggestions.map((s: AISuggestion) => ({ ...s, status: 'accepted' as const }));
          set({ suggestions: autoAccepted, isAnalyzing: false, progressMessage: `Auto-accepted ${autoAccepted.length} suggestions — applying...` });
          // Auto-inject accepted suggestions
          get().injectAccepted(videoId).then(() => {
            set({ progressMessage: `Done! ${autoAccepted.length} H5P interactions added.` });
          }).catch((err: unknown) => {
            set({ progressMessage: `Suggestions ready but injection failed: ${err instanceof Error ? err.message : 'unknown error'}` });
          });
          break;
        }
        case 'error':
          set({ analyzeError: event.message, isAnalyzing: false, progressMessage: '' });
          break;
        case 'usage':
          // silently log token usage
          break;
      }
    });

    return cleanup;
  },

  resetAnalysis: () => set({ suggestions: [], previousSuggestions: [], progressMessage: '', analyzeError: null, streamedText: '' }),

  // Suggestion management
  setSuggestionStatus: (id, status) =>
    set((s) => ({
      suggestions: s.suggestions.map((sg) => (sg.id === id ? { ...sg, status } : sg)),
    })),

  updateSuggestionConfig: (id, config) =>
    set((s) => ({
      suggestions: s.suggestions.map((sg) => (sg.id === id ? { ...sg, config } : sg)),
    })),

  acceptAll: () =>
    set((s) => ({
      suggestions: s.suggestions.map((sg) => (sg.status === 'pending' ? { ...sg, status: 'accepted' } : sg)),
    })),

  rejectAll: () =>
    set((s) => ({
      suggestions: s.suggestions.map((sg) => (sg.status === 'pending' ? { ...sg, status: 'rejected' } : sg)),
    })),

  removeRejected: () =>
    set((s) => ({ suggestions: s.suggestions.filter((sg) => sg.status !== 'rejected') })),

  // Injection
  isInjecting: false,
  injectError: null,
  lastInjectCount: 0,

  injectAccepted: async (videoId) => {
    const accepted = get().suggestions.filter((s) => s.status === 'accepted');
    if (!accepted.length) {
      set({ injectError: 'No accepted suggestions to apply.' });
      return;
    }

    set({ isInjecting: true, injectError: null });

    try {
      const result = await injectSuggestions(accepted, videoId);
      const injectedIds = new Set(result.injected.map((i) => i.suggestionId));
      set((s) => ({
        isInjecting: false,
        lastInjectCount: result.injected.length,
        suggestions: s.suggestions.filter((sg) => !injectedIds.has(sg.id)),
      }));
      // Reload H5P contents
      await get().loadH5PContents(videoId);
    } catch (err: unknown) {
      set({ isInjecting: false, injectError: err instanceof Error ? err.message : 'Injection failed' });
    }
  },

  // Playback
  currentTime: 0,
  setCurrentTime: (t) => set({ currentTime: t }),
}));
