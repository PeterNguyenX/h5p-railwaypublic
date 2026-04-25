import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, ChevronRight, UploadCloud, PlayCircle,
  Sparkles, Plus, Play, Info, Share2, X, Lightbulb,
  FileText, Check, Trash2, Edit3, Loader2, AlertCircle,
  ChevronDown, Download, RefreshCw, Clock, Scissors, Users, Mic,
  ToggleLeft, List, MousePointer, Type
} from "lucide-react";
import { useEditorStore } from "../lib/editorStore";
import { useAuthStore } from "../lib/authStore";
import {
  fetchVideo, uploadVideo, importYoutube, parseTranscript, exportH5P,
  autoTranscribe, extractVideoTranscript, createH5PContent,
} from "../lib/api";
import type { AISuggestion, H5PInteractionType, TranscriptSegment, Video } from "../lib/api";
import { recordVideoVisit } from "../lib/videoVisit";
import { io, Socket } from "socket.io-client";

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

const TYPE_LABELS: Record<string, string> = {
  MultiChoice: "Multiple Choice",
  TrueFalse: "True / False",
  FillBlanks: "Fill in Blanks",
  Hotspot: "Hotspot",
  DragDrop: "Drag & Drop",
};

const TYPE_COLORS: Record<string, string> = {
  MultiChoice: "bg-blue-100 text-blue-800",
  TrueFalse: "bg-purple-100 text-purple-800",
  FillBlanks: "bg-green-100 text-green-800",
  Hotspot: "bg-amber-100 text-amber-800",
  DragDrop: "bg-pink-100 text-pink-800",
  MarkWords: "bg-teal-100 text-teal-800",
};

const H5P_TYPES: Array<{ type: H5PInteractionType; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }> = [
  { type: "MultiChoice", label: "Multiple Choice", icon: List, desc: "Question with 4 options, one correct" },
  { type: "TrueFalse", label: "True / False", icon: ToggleLeft, desc: "Binary true or false question" },
  { type: "FillBlanks", label: "Fill in Blanks", icon: Type, desc: "Sentence with missing words" },
  { type: "Hotspot", label: "Hotspot", icon: MousePointer, desc: "Interactive image with clickable areas" },
  { type: "DragDrop", label: "Drag & Drop", icon: Info, desc: "Sort items into categories" },
  { type: "MarkWords", label: "Mark the Words", icon: Lightbulb, desc: "Highlight key terms in a passage" },
];

// ─── Manual H5P Modal ─────────────────────────────────────────────────────────

function buildDefaultConfig(type: H5PInteractionType): Record<string, unknown> {
  switch (type) {
    case "MultiChoice":
      return {
        question: "What is the main concept discussed?",
        answers: [
          { text: "Option A (correct)", correct: true },
          { text: "Option B", correct: false },
          { text: "Option C", correct: false },
          { text: "Option D", correct: false },
        ],
      };
    case "TrueFalse":
      return { question: "This statement about the topic is true.", correct: true };
    case "FillBlanks":
      return {
        text: "The key concept is *answer* which relates to the topic.",
        questions: [{ text: "answer" }],
      };
    case "Hotspot":
      return {
        question: "Click on the correct area in the image.",
        imageDescription: "Describe what the image shows",
        spots: [],
      };
    case "DragDrop":
      return {
        question: "Sort these items into the correct categories.",
        items: [
          { text: "Item 1", category: "Category A" },
          { text: "Item 2", category: "Category B" },
        ],
        categories: ["Category A", "Category B"],
      };
    case "MarkWords":
      return {
        taskDescription: "Mark all the key concepts in the text below.",
        textField: "The *photosynthesis* process uses *sunlight* and *carbon dioxide* to produce *glucose*.",
      };
  }
}

function ManualH5PModal({
  onSave,
  onClose,
  currentTime,
}: {
  onSave: (type: H5PInteractionType, config: Record<string, unknown>, timestamp: number) => void;
  onClose: () => void;
  currentTime: number;
}) {
  const [selectedType, setSelectedType] = useState<H5PInteractionType>("MultiChoice");
  const [timestamp, setTimestamp] = useState(Math.floor(currentTime));
  const [json, setJson] = useState(() => JSON.stringify(buildDefaultConfig("MultiChoice"), null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (type: H5PInteractionType) => {
    setSelectedType(type);
    setJson(JSON.stringify(buildDefaultConfig(type), null, 2));
    setError(null);
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setError("Config must be a JSON object");
        return;
      }
      onSave(selectedType, parsed, timestamp);
    } catch {
      setError("Invalid JSON syntax");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Add H5P Interaction</h3>
            <p className="text-sm text-slate-500">Choose a type and configure the content</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Interaction Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {H5P_TYPES.map(({ type, label, icon: Icon, desc }) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                    selectedType === type
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-bold text-xs">{label}</span>
                  </div>
                  <span className="text-xs text-slate-500 leading-tight">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Timestamp */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Timestamp (seconds)</label>
            <input
              type="number"
              min={0}
              value={timestamp}
              onChange={(e) => setTimestamp(Number(e.target.value))}
              className="w-40 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <span className="ml-2 text-xs text-slate-500">{formatTime(timestamp)}</span>
          </div>

          {/* Config JSON */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-700">Configuration (JSON)</label>
              <button
                onClick={() => {
                  try {
                    setJson(JSON.stringify(JSON.parse(json), null, 2));
                    setError(null);
                  } catch {
                    setError("Invalid JSON");
                  }
                }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Format
              </button>
            </div>
            <textarea
              value={json}
              onChange={(e) => { setJson(e.target.value); setError(null); }}
              rows={10}
              className="w-full font-mono text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow-sm transition-colors text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Interaction
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Video Trim Bar ───────────────────────────────────────────────────────────

function VideoTrimBar({
  duration,
  trimStart,
  trimEnd,
  onTrimStart,
  onTrimEnd,
}: {
  duration: number;
  trimStart: number;
  trimEnd: number;
  onTrimStart: (v: number) => void;
  onTrimEnd: (v: number) => void;
}) {
  if (!duration) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Scissors className="w-4 h-4 text-slate-600" />
        <h4 className="font-bold text-slate-800 text-sm">Trim Video</h4>
        <span className="ml-auto text-xs text-slate-500">
          {formatTime(trimStart)} → {formatTime(trimEnd)} ({formatTime(trimEnd - trimStart)} kept)
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 w-16 shrink-0">Start</label>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.5}
            value={trimStart}
            onChange={(e) => onTrimStart(Math.min(Number(e.target.value), trimEnd - 1))}
            className="flex-1 accent-orange-500"
          />
          <span className="text-xs font-mono text-slate-700 w-12 text-right">{formatTime(trimStart)}</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 w-16 shrink-0">End</label>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.5}
            value={trimEnd}
            onChange={(e) => onTrimEnd(Math.max(Number(e.target.value), trimStart + 1))}
            className="flex-1 accent-orange-500"
          />
          <span className="text-xs font-mono text-slate-700 w-12 text-right">{formatTime(trimEnd)}</span>
        </div>
        {/* Visual timeline */}
        <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute top-0 bottom-0 bg-orange-400/40 border-x-2 border-orange-500"
            style={{
              left: `${(trimStart / duration) * 100}%`,
              right: `${((duration - trimEnd) / duration) * 100}%`,
            }}
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">Trim points are saved with the export. Actual video cutting happens on export.</p>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  isNew,
  onAccept,
  onReject,
  onEdit,
  onSeek,
}: {
  suggestion: AISuggestion;
  isNew: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
  onSeek: (t: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = TYPE_COLORS[suggestion.type] || "bg-slate-100 text-slate-700";

  const borderColor =
    suggestion.status === "accepted"
      ? "border-green-400 bg-green-50/30"
      : suggestion.status === "rejected"
      ? "border-red-300 bg-red-50/20 opacity-50"
      : "border-slate-200 bg-white";

  const question =
    (suggestion.config?.question as string) ||
    (suggestion.config?.text as string) ||
    JSON.stringify(suggestion.config).slice(0, 100);

  return (
    <div className={`rounded-xl border transition-all mb-3 ${borderColor}`}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <button
            onClick={() => onSeek(suggestion.timestamp)}
            className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-700 transition-colors shrink-0"
            title="Jump to this timestamp"
          >
            <Clock className="w-3 h-3" />
            {formatTime(suggestion.timestamp)}
          </button>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colorClass} shrink-0`}>
            {TYPE_LABELS[suggestion.type] || suggestion.type}
          </span>
          {isNew && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 shrink-0">
              New
            </span>
          )}
          {suggestion.status !== "pending" && (
            <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
              suggestion.status === "accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {suggestion.status === "accepted" ? "✓ Accepted" : "✗ Rejected"}
            </span>
          )}
        </div>

        {/* Preview */}
        <p
          className="text-sm text-slate-800 leading-relaxed cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? question : question.slice(0, 120) + (question.length > 120 ? "…" : "")}
        </p>

        {expanded && (
          <pre className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 overflow-x-auto max-h-40 whitespace-pre-wrap">
            {JSON.stringify(suggestion.config, null, 2)}
          </pre>
        )}

        {suggestion.reason && (
          <p className="mt-2 text-xs text-slate-500 italic">💡 {suggestion.reason}</p>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Collapse" : "Show config"}
        </button>
      </div>

      {/* Actions */}
      {suggestion.status === "pending" ? (
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={onAccept}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Accept
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      ) : (
        <div className="px-4 pb-3 flex gap-2">
          {suggestion.status === "accepted" && (
            <button onClick={onReject} className="text-xs text-slate-400 hover:text-red-600 transition-colors">
              Undo accept
            </button>
          )}
          {suggestion.status === "rejected" && (
            <button onClick={onAccept} className="text-xs text-slate-400 hover:text-green-600 transition-colors">
              Restore
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionEditModal({
  suggestion,
  onSave,
  onClose,
}: {
  suggestion: AISuggestion;
  onSave: (config: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [json, setJson] = useState(JSON.stringify(suggestion.config, null, 2));
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setError("Config must be a JSON object");
        return;
      }
      onSave(parsed);
    } catch {
      setError("Invalid JSON syntax");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Edit Suggestion Config</h3>
            <p className="text-sm text-slate-500">
              {formatTime(suggestion.timestamp)} — {TYPE_LABELS[suggestion.type] || suggestion.type}
            </p>
          </div>
          <button onClick={onClose} title="Close" aria-label="Close modal" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {suggestion.reason && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
              <strong>AI reasoning:</strong> {suggestion.reason}
            </div>
          )}
          <label className="block text-sm font-semibold text-slate-700 mb-2">H5P Config JSON</label>
          <textarea
            title="H5P configuration JSON editor"
            aria-label="H5P configuration JSON"
            value={json}
            onChange={(e) => { setJson(e.target.value); setError(null); }}
            rows={14}
            className="w-full font-mono text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
          {error && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between gap-3">
          <button
            onClick={() => { try { setJson(JSON.stringify(JSON.parse(json), null, 2)); setError(null); } catch { setError("Invalid JSON"); } }}
            className="px-4 py-2.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-colors text-sm"
          >
            Format JSON
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm">
              Cancel
            </button>
            <button onClick={handleSave} className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow-sm transition-colors text-sm">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Editor ───────────────────────────────────────────────────────────────

export default function Editor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { token, user } = useAuthStore();
  const store = useEditorStore();

  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [activeUploadTab, setActiveUploadTab] = useState<"file" | "youtube">("file");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState<AISuggestion | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  // Manual H5P add modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [isAddingH5P, setIsAddingH5P] = useState(false);

  // Video trim
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [showTrim, setShowTrim] = useState(false);

  // Auto-transcription
  const [isAutoTranscribing, setIsAutoTranscribing] = useState(false);

  // Real-time collaboration
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);
  const analysisCleanupRef = useRef<(() => void) | null>(null);
  const transcriptAttemptedRef = useRef<Set<string>>(new Set());

  const notify = useCallback((msg: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const extractYouTubeVideoId = useCallback((rawUrl?: string): string | null => {
    if (!rawUrl) return null;
    const input = rawUrl.trim();
    if (!input) return null;

    const parseFromUrl = (value: string): string | null => {
      try {
        const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
        const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();

        if (host === 'youtu.be') {
          const directId = parsed.pathname.split('/').filter(Boolean)[0];
          return directId || null;
        }

        if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
          const watchId = parsed.searchParams.get('v');
          if (watchId) return watchId;

          const parts = parsed.pathname.split('/').filter(Boolean);
          const markerIndex = parts.findIndex((part) => ['embed', 'shorts', 'live', 'v'].includes(part));
          if (markerIndex >= 0 && parts[markerIndex + 1]) {
            return parts[markerIndex + 1];
          }
        }
      } catch {
        return null;
      }

      return null;
    };

    return parseFromUrl(input);
  }, []);

  const toTranscriptSegments = useCallback((value: unknown): TranscriptSegment[] => {
    if (!Array.isArray(value)) return [];

    return value
      .map((seg) => {
        const item = seg as { start?: number; end?: number; text?: string };
        if (typeof item.start !== 'number' || typeof item.end !== 'number' || typeof item.text !== 'string') {
          return null;
        }
        return { start: item.start, end: item.end, text: item.text };
      })
      .filter((seg): seg is TranscriptSegment => Boolean(seg));
  }, []);

  const prepareTranscriptForVideo = useCallback(async (video: Video) => {
    if (!video.id || transcriptAttemptedRef.current.has(video.id)) return;
    transcriptAttemptedRef.current.add(video.id);

    const captions = video.captions as { segments?: unknown; source?: string } | undefined;
    const inlineSegments = toTranscriptSegments(captions?.segments);
    if (inlineSegments.length > 0) {
      store.setSegments(inlineSegments);
      store.setTranscriptFilename(`auto-transcribed (${captions?.source || 'captions'})`);
      notify(`Transcript ready (${inlineSegments.length} segments).`, 'success');
      return;
    }

    setIsAutoTranscribing(true);
    try {
      if (video.youtubeUrl) {
        const extractedSegments = await extractVideoTranscript(video.id);
        store.setSegments(extractedSegments);
        store.setTranscriptFilename('auto-transcribed (youtube captions)');
        notify(`Transcript ready (${extractedSegments.length} segments).`, 'success');
      } else if (video.filePath) {
        const result = await autoTranscribe(video.id);
        store.setSegments(result.segments);
        store.setTranscriptFilename(`auto-transcribed (${result.source})`);
        notify(result.message, 'success');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Auto-transcription failed';
      notify(`${message}. You can still upload a .vtt/.srt manually.`, 'info');
    } finally {
      setIsAutoTranscribing(false);
    }
  }, [notify, store, toTranscriptSegments]);

  // Redirect if not logged in
  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  // Load existing video if editing
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const video = await fetchVideo(id);
        store.setVideo(video);
        recordVideoVisit(id);
        await store.loadH5PContents(id);
        if (store.segments.length === 0) {
          void prepareTranscriptForVideo(video);
        }
        setCurrentStep(2); // jump to edit step if video already exists
      } catch {
        setNotification({ msg: "Could not load video.", type: "error" });
      }
    };
    load();
  }, [id, prepareTranscriptForVideo, store]);

  // Cleanup analysis stream on unmount
  useEffect(() => () => { analysisCleanupRef.current?.(); }, []);

  // Initialize trim end when video duration is known
  useEffect(() => {
    if (store.video?.duration && trimEnd === 0) {
      setTrimEnd(store.video.duration);
    }
  }, [store.video?.duration]);

  // Socket.io real-time collaboration
  useEffect(() => {
    if (!store.video?.id || !user) return;

    const SOCKET_URL = (() => {
      if (typeof window !== 'undefined') {
        const { hostname, port } = window.location;
        if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '3002') {
          return 'http://localhost:5001';
        }
      }
      return window.location.origin;
    })();

    const socket = io(SOCKET_URL, { withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.emit('join-video', { videoId: store.video.id, username: user.username });

    socket.on('collaborators-updated', ({ collaborators: list }: { collaborators: string[] }) => {
      setCollaborators(list);
    });

    // Sync remote suggestion changes
    socket.on('suggestion-status', ({ suggestionId, status }: { suggestionId: string; status: 'accepted' | 'rejected'; by: string }) => {
      store.setSuggestionStatus(suggestionId, status);
    });

    // Sync remote H5P additions/removals
    socket.on('h5p-added', () => {
      if (store.video?.id) store.loadH5PContents(store.video.id);
    });

    socket.on('h5p-removed', ({ contentId }: { contentId: string }) => {
      store.setH5pContents(store.h5pContents.filter((c) => c.id !== contentId));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [store.video?.id, user?.username]);

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("video", file);
      form.append("title", file.name.replace(/\.[^/.]+$/, ""));
      const video = await uploadVideo(form);
      store.setVideo(video);
      await store.loadH5PContents(video.id);
      setCurrentStep(2);
      notify("Video uploaded successfully!", "success");
      void prepareTranscriptForVideo(video);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleYoutubeImport = async () => {
    if (!youtubeLink.trim()) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const video = await importYoutube(youtubeLink.trim());
      store.setVideo(video);
      await store.loadH5PContents(video.id);
      setCurrentStep(2);
      notify("YouTube video imported!", "success");
      void prepareTranscriptForVideo(video);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "YouTube import failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTranscriptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    store.setTranscriptFilename(file.name);
    try {
      const segments = await parseTranscript(file);
      store.setSegments(segments);
      notify(`Parsed ${segments.length} transcript segments from "${file.name}"`, "success");
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Failed to parse transcript", "error");
    }
  };

  const handleAutoTranscribe = async () => {
    if (!store.video?.id) return;
    setIsAutoTranscribing(true);
    try {
      const result = await autoTranscribe(store.video.id);
      store.setSegments(result.segments);
      store.setTranscriptFilename(`auto-transcribed (${result.source})`);
      notify(result.message, "success");
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Auto-transcription failed", "error");
    } finally {
      setIsAutoTranscribing(false);
    }
  };

  const handleManualH5PAdd = async (type: H5PInteractionType, config: Record<string, unknown>, timestamp: number) => {
    if (!store.video?.id) return;
    setIsAddingH5P(true);
    setShowManualModal(false);
    try {
      const content = await createH5PContent(store.video.id, type, config, timestamp);
      store.setH5pContents([...store.h5pContents, content]);
      socketRef.current?.emit('h5p-added', { videoId: store.video.id, content });
      notify(`Added ${TYPE_LABELS[type] || type} at ${formatTime(timestamp)}`, "success");
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Failed to add interaction", "error");
    } finally {
      setIsAddingH5P(false);
    }
  };

  const handleRunAnalysis = () => {
    if (!store.video?.id) return;
    analysisCleanupRef.current?.();
    const cleanup = store.runAnalysis(store.video.id);
    analysisCleanupRef.current = cleanup;
  };

  const handleApply = async () => {
    if (!store.video?.id) return;
    await store.injectAccepted(store.video.id);
    if (store.injectError) {
      notify(store.injectError, "error");
    } else {
      notify(`Successfully injected ${store.lastInjectCount} H5P element${store.lastInjectCount !== 1 ? "s" : ""}!`, "success");
      setShowSuccessBanner(true);
      socketRef.current?.emit('h5p-added', { videoId: store.video.id });
    }
  };

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleExport = async () => {
    if (!store.video?.id) return;
    setIsExporting(true);
    try {
      const blob = await exportH5P(store.video.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${store.video.title?.replace(/[^a-z0-9]/gi, "-") || "video"}.h5p`;
      a.click();
      URL.revokeObjectURL(url);
      notify("Exported .h5p file!", "success");
    } catch {
      notify("Export failed", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // ─── Derived values ────────────────────────────────────────────────────────────

  const youtubeId = store.video?.youtubeId || extractYouTubeVideoId(store.video?.youtubeUrl);
  const youtubeEmbedSrc = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : null;

  const videoSrc = store.video
    ? store.video.filePath
      ? `/api/uploads/${store.video.filePath}`
      : null
    : null;

  const acceptedCount = store.suggestions.filter((s) => s.status === "accepted").length;
  const pendingCount = store.suggestions.filter((s) => s.status === "pending").length;
  const previousIds = new Set(store.previousSuggestions.map((s) => s.id));

  const videoThumbnail = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : store.video?.thumbnailPath
    ? `/api/uploads/${store.video.thumbnailPath}`
    : null;

  // ─── Render ────────────────────────────────────────────────────────────────────

  const steps = [
    { id: 1, name: "Add Video", desc: "Upload or link" },
    { id: 2, name: "Add Interactions", desc: "Questions & info" },
    { id: 3, name: "Finish & Share", desc: "Preview & export" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/app/dashboard")}
            title="Go back to dashboard"
            aria-label="Go back to dashboard"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-300 hidden sm:block" />
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {store.video?.title || "New Interactive Video"}
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              {store.video ? `ID: ${store.video.id}` : "No video loaded"}
            </p>
          </div>
          <span className={`hidden sm:inline px-2.5 py-1 text-xs font-semibold rounded-md ${
            store.video?.status === "ready" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
          }`}>
            {store.video?.status === "ready" ? "Ready" : "Draft"}
          </span>
        </div>

        {/* Stepper */}
        <div className="hidden md:flex items-center gap-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => store.video && setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  currentStep === step.id
                    ? "bg-blue-50 text-blue-800"
                    : currentStep > step.id
                    ? "text-slate-700 hover:bg-slate-100"
                    : "text-slate-400"
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep === step.id ? "bg-blue-800 text-white" : "bg-slate-200 text-slate-500"
                  }`}>
                    {step.id}
                  </span>
                )}
                <span className="font-bold text-sm">{step.name}</span>
              </button>
              {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 mx-2" />}
            </div>
          ))}
        </div>

        {store.video && (
          <div className="flex items-center gap-2">
            {collaborators.length > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-semibold">
                <Users className="w-4 h-4" />
                {collaborators.length} editing
              </div>
            )}
            <button
              onClick={handleExport}
              disabled={isExporting || store.h5pContents.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 transition-colors text-sm disabled:opacity-40"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export .h5p
            </button>
          </div>
        )}
      </header>

      {/* ── Toast ──────────────────────────────────────────────────────────────── */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-semibold animate-in slide-in-from-top-2 duration-300 ${
          notification.type === "success" ? "bg-green-600 text-white" :
          notification.type === "error" ? "bg-red-600 text-white" :
          "bg-slate-800 text-white"
        }`}>
          {notification.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notification.msg}
          <button onClick={() => setNotification(null)} title="Close notification" aria-label="Close notification"><X className="w-4 h-4 opacity-70 hover:opacity-100" /></button>
        </div>
      )}

      {/* ── Main ───────────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center w-full">
        <div className="w-full max-w-5xl h-full flex flex-col">

          {/* ── STEP 1: Upload ─────────────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center max-w-xl mx-auto mb-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Let's add your video</h1>
                <p className="text-slate-600 text-lg">
                  Upload a video file or paste a YouTube link. Then add AI-powered H5P interactions.
                </p>
              </div>

              {/* Upload Tabs */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex bg-slate-100 p-1.5 rounded-xl">
                  {(["file", "youtube"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveUploadTab(tab)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-[15px] transition-all ${
                        activeUploadTab === tab ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {tab === "file" ? <UploadCloud className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                      {tab === "file" ? "Upload File" : "YouTube Link"}
                    </button>
                  ))}
                </div>
              </div>

              {uploadError && (
                <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm max-w-lg mx-auto">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  {uploadError}
                </div>
              )}

              {/* File Upload */}
              {activeUploadTab === "file" ? (
                <div>
                  <input ref={fileInputRef} title="Select video file" aria-label="Select video file" type="file" accept="video/*" onChange={handleVideoFileUpload} className="hidden" />
                  <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl p-12 text-center hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer group"
                  >
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 border border-slate-200">
                      {isUploading ? (
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                      ) : (
                        <UploadCloud className="w-10 h-10 text-slate-600" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      {isUploading ? "Uploading..." : "Click to upload video"}
                    </h3>
                    <p className="text-slate-500 mb-6">MP4, WebM, or OGG up to 500MB</p>
                    <span className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors text-[15px]">
                      Browse Files
                    </span>
                  </div>
                </div>
              ) : (
                <div className="max-w-xl mx-auto">
                  <label className="block text-[15px] font-bold text-slate-700 mb-2">Paste YouTube URL</label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={youtubeLink}
                      onChange={(e) => setYoutubeLink(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[15px]"
                    />
                    <button
                      onClick={handleYoutubeImport}
                      disabled={isUploading || !youtubeLink.trim()}
                      className="px-6 py-3.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-[15px] whitespace-nowrap shadow-sm flex items-center gap-2"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Import Video
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-12 flex justify-end">
                <button
                  onClick={() => store.video && setCurrentStep(2)}
                  disabled={!store.video}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm transition-all text-lg flex items-center gap-2"
                >
                  Continue to Add Interactions
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Edit / Enrich ──────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-8 duration-500">

              {/* Video Preview */}
              <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-800 relative aspect-video flex-shrink-0">
                {videoSrc ? (
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    controls
                    onTimeUpdate={() => store.setCurrentTime(videoRef.current?.currentTime || 0)}
                    className="w-full h-full object-contain"
                  />
                ) : youtubeEmbedSrc ? (
                  <iframe
                    src={youtubeEmbedSrc}
                    title={store.video?.title || 'YouTube video preview'}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : videoThumbnail ? (
                  <div className="w-full h-full relative">
                    <img src={videoThumbnail} alt="Video thumbnail" className="w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2">
                      <PlayCircle className="w-12 h-12 text-red-500" />
                      <p className="text-sm font-semibold">YouTube video — preview not available in editor</p>
                      <a
                        href={store.video?.youtubeUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-sm flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" /> Open on YouTube
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <p>Video not available</p>
                  </div>
                )}

                {/* H5P markers overlay */}
                {store.h5pContents.length > 0 && (
                  <div className="absolute bottom-4 left-0 right-0 px-4 flex gap-2 flex-wrap">
                    {store.h5pContents.map((c, i) => (
                      <div key={i} className="bg-orange-500 border-2 border-white rounded-full w-5 h-5 shadow-sm cursor-pointer hover:scale-125 transition-transform" title={`Interaction at ${formatTime(c.timestamp)}`} />
                    ))}
                  </div>
                )}
              </div>

              {/* Three-panel tools area */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-0">

                {/* LEFT: Transcript + AI controls */}
                <div className="md:col-span-4 flex flex-col gap-4">
                  {/* Transcript Upload */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Transcript
                    </h3>
                    <input
                      ref={transcriptInputRef}
                      type="file"
                      title="Select transcript file"
                      aria-label="Select transcript file"
                      accept=".vtt,.srt"
                      onChange={handleTranscriptUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => transcriptInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 border border-dashed border-slate-300 hover:bg-blue-50 hover:border-blue-300 rounded-xl text-slate-700 font-semibold text-sm transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      {store.transcriptFilename || "Upload .vtt / .srt file"}
                    </button>
                    {store.video?.filePath && (
                      <button
                        onClick={handleAutoTranscribe}
                        disabled={isAutoTranscribing}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-50 border border-violet-200 hover:bg-violet-100 disabled:opacity-50 rounded-xl text-violet-800 font-semibold text-sm transition-colors"
                      >
                        {isAutoTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                        {isAutoTranscribing ? "Transcribing..." : "Auto-Transcribe (AI)"}
                      </button>
                    )}
                    {store.segments.length > 0 && (
                      <p className="mt-2 text-xs text-green-700 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {store.segments.length} segments parsed
                      </p>
                    )}
                  </div>

                  {/* AI Analysis */}
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-slate-800 text-base">AI Enrichment</h3>
                    </div>
                    {store.segments.length === 0 ? (
                      <p className="text-slate-500 text-sm mb-3">Upload a transcript to enable AI analysis.</p>
                    ) : (
                      <p className="text-slate-600 text-sm mb-3">
                        {store.segments.length} segments ready. AI will generate H5P interactions.
                      </p>
                    )}

                    {store.isAnalyzing ? (
                      <div className="flex flex-col items-center gap-2 py-3">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <p className="text-sm font-semibold text-slate-700">{store.progressMessage}</p>
                        {store.streamedText && (
                          <p className="text-xs text-slate-400 text-center line-clamp-2">{store.streamedText.slice(-100)}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleRunAnalysis}
                          disabled={store.segments.length === 0}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
                        >
                          <Sparkles className="w-4 h-4" />
                          Run AI Analysis
                        </button>
                        {store.suggestions.length > 0 && (
                          <button
                            onClick={handleRunAnalysis}
                            disabled={store.segments.length === 0}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-800 font-semibold rounded-xl transition-colors text-sm"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Re-run (shows diff)
                          </button>
                        )}
                      </div>
                    )}

                    {store.analyzeError && (
                      <p className="mt-2 text-xs text-red-700 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {store.analyzeError}
                      </p>
                    )}
                  </div>

                  {/* Manual Content Type Picker */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-base mb-3">Add Manually</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {H5P_TYPES.map(({ type, label, icon: Icon }) => (
                        <button
                          key={type}
                          onClick={() => setShowManualModal(true)}
                          disabled={!store.video?.id || isAddingH5P}
                          className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-800 transition-all text-slate-700 font-semibold text-xs group disabled:opacity-40"
                        >
                          <Icon className="w-5 h-5 text-slate-500 group-hover:text-blue-700 transition-colors" />
                          {label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowManualModal(true)}
                      disabled={!store.video?.id || isAddingH5P}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors"
                    >
                      {isAddingH5P ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {isAddingH5P ? "Adding..." : "Add Interaction"}
                    </button>
                  </div>

                  {/* Video Trim */}
                  <div>
                    <button
                      onClick={() => setShowTrim((v) => !v)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold text-sm transition-colors"
                    >
                      <Scissors className="w-4 h-4" />
                      {showTrim ? "Hide Trim" : "Trim Video"}
                    </button>
                    {showTrim && store.video?.duration && (
                      <div className="mt-2">
                        <VideoTrimBar
                          duration={store.video.duration}
                          trimStart={trimStart}
                          trimEnd={trimEnd || store.video.duration}
                          onTrimStart={setTrimStart}
                          onTrimEnd={setTrimEnd}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: Suggestions panel */}
                <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col max-h-[600px] overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">
                        AI Suggestions {store.suggestions.length > 0 ? `(${store.suggestions.length})` : ""}
                      </h3>
                      {store.suggestions.length > 0 && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {acceptedCount} accepted · {pendingCount} pending
                        </p>
                      )}
                    </div>
                    {store.suggestions.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => store.acceptAll()}
                          className="text-xs px-3 py-1.5 bg-green-50 text-green-700 font-bold hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                        >
                          Accept All
                        </button>
                        <button
                          onClick={() => store.rejectAll()}
                          className="text-xs px-3 py-1.5 bg-slate-50 text-slate-600 font-semibold hover:bg-red-50 hover:text-red-700 rounded-lg border border-slate-200 transition-colors"
                        >
                          Reject All
                        </button>
                        <button
                          onClick={() => store.removeRejected()}
                          className="text-xs px-3 py-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        >
                          Clear Rejected
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    {store.suggestions.length === 0 && !store.isAnalyzing ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
                        <Sparkles className="w-10 h-10 mb-3 text-slate-200" />
                        <p className="font-semibold text-slate-500">No suggestions yet</p>
                        <p className="text-sm mt-1">Upload a transcript and run AI analysis to generate H5P interactions.</p>
                      </div>
                    ) : (
                      [...store.suggestions]
                        .sort((a, b) => a.timestamp - b.timestamp)
                        .map((suggestion) => (
                          <SuggestionCard
                            key={suggestion.id}
                            suggestion={suggestion}
                            isNew={!previousIds.has(suggestion.id)}
                            onAccept={() => store.setSuggestionStatus(suggestion.id, "accepted")}
                            onReject={() => store.setSuggestionStatus(suggestion.id, "rejected")}
                            onEdit={() => setEditingSuggestion(suggestion)}
                            onSeek={seekTo}
                          />
                        ))
                    )}
                  </div>

                  {/* H5P Contents already applied */}
                  {store.h5pContents.length > 0 && (
                    <div className="p-4 border-t border-slate-100 shrink-0">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Applied to video ({store.h5pContents.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {store.h5pContents.map((c) => (
                          <div key={c.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
                            <span className="font-mono">{formatTime(c.timestamp)}</span>
                            <span>{c.library?.split(" ")[0]?.replace("H5P.", "") || "H5P"}</span>
                            <button onClick={() => store.removeH5PContent(c.id)} title="Remove H5P content" aria-label="Remove H5P content" className="ml-1 text-slate-400 hover:text-red-600">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom actions */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-[15px]"
                >
                  Back
                </button>
                <div className="flex items-center gap-3">
                  {acceptedCount > 0 && (
                    <button
                      onClick={handleApply}
                      disabled={store.isInjecting}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-colors text-[15px]"
                    >
                      {store.isInjecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Apply {acceptedCount} Interaction{acceptedCount !== 1 ? "s" : ""}
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm transition-all text-[15px] flex items-center gap-2"
                  >
                    Continue to Finish
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Finish & Share ─────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 animate-in fade-in slide-in-from-right-8 duration-500 text-center max-w-2xl mx-auto w-full">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-200 shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-slate-900 mb-4">Your video is ready!</h1>
              <p className="text-slate-600 text-lg mb-10">
                <strong>"{store.video?.title || "Your Video"}"</strong> has{" "}
                {store.h5pContents.length} H5P interaction{store.h5pContents.length !== 1 ? "s" : ""}.
              </p>

              <div className="space-y-4 mb-12 text-left">
                {/* Share Link */}
                <div className="p-6 border-2 border-blue-900 bg-slate-50 rounded-2xl flex gap-5 items-start shadow-sm">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 shrink-0">
                    <Share2 className="w-7 h-7 text-blue-900" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Share Direct Link</h3>
                    <p className="text-slate-600 text-[15px] mb-3">Get a simple web link you can share with students.</p>
                    {store.video && (
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                        <code className="text-xs text-slate-600 flex-1 truncate">
                          {window.location.origin}/api/videos/{store.video.id}
                        </code>
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/videos/${store.video!.id}`); notify("Copied!", "success"); }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Export H5P */}
                <div className="p-6 border border-slate-200 bg-white rounded-2xl flex gap-5 items-start hover:border-slate-300 hover:bg-slate-50 transition-all">
                  <div className="p-3 bg-slate-100 rounded-xl shrink-0 border border-slate-200">
                    <Download className="w-7 h-7 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Export for LMS (.h5p)</h3>
                    <p className="text-slate-500 text-[15px] mb-3">
                      Export a standard package for Canvas, Moodle, or Blackboard.
                    </p>
                    <button
                      onClick={handleExport}
                      disabled={isExporting || store.h5pContents.length === 0}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-sm"
                    >
                      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {isExporting ? "Exporting..." : `Export ${store.h5pContents.length} interactions`}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-[15px]"
                >
                  Back to Editor
                </button>
                <button
                  onClick={() => navigate("/app/dashboard")}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm transition-all text-lg flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Edit Modal ─────────────────────────────────────────────────────────── */}
      {editingSuggestion && (
        <SuggestionEditModal
          suggestion={editingSuggestion}
          onSave={(config) => {
            store.updateSuggestionConfig(editingSuggestion.id, config);
            setEditingSuggestion(null);
            notify("Config updated", "success");
          }}
          onClose={() => setEditingSuggestion(null)}
        />
      )}

      {/* ── Manual H5P Modal ───────────────────────────────────────────────────── */}
      {showManualModal && (
        <ManualH5PModal
          onSave={handleManualH5PAdd}
          onClose={() => setShowManualModal(false)}
          currentTime={store.currentTime}
        />
      )}

      {/* ── Floating Staging Bar ───────────────────────────────────────────────── */}
      {currentStep === 2 && acceptedCount > 0 && !store.isInjecting && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg px-6 py-3 flex items-center justify-between z-40">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-semibold text-slate-700">
              {acceptedCount} interaction{acceptedCount !== 1 ? "s" : ""} staged for apply
            </span>
          </div>
          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Apply to H5P
          </button>
        </div>
      )}
    </div>
  );
}
