import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Home, CheckCircle2, ChevronRight, ChevronDown, UploadCloud, Youtube,
  Sparkles, Plus, Save, X, Loader2, AlertCircle,
  Download, Clock, Package, Trash2,
  ChevronLeft, FileText, Play, Pause, Pencil, Link,
  ListChecks, ToggleLeft, PenLine, Shuffle, MoveHorizontal, Highlighter
} from "lucide-react";
import { useEditorStore } from "../../lib/editorStore";
import { useAuthStore } from "../../lib/authStore";
import {
  fetchVideo, uploadVideo, importYoutube, parseTranscript,
  extractTranscriptFromVideo, whisperTranscribeVideo, exportH5P,
  uploadH5PFile, createH5PContent, updateH5PContent, updateVideoTitle,
  fetchAIUsage,
} from "../../lib/api";
import type { H5PContent, TopicNode } from "../../lib/api";
import { recordVideoVisit } from "../../lib/videoVisit";
import { useT } from "../../lib/useT";
import i18n from "../../../../context/i18n";

// YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string | HTMLElement, options: YTPlayerOptions) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  pauseVideo(): void;
  playVideo(): void;
  destroy(): void;
}
interface YTPlayerOptions {
  videoId: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, unknown>;
  events?: {
    onReady?: (e: { target: YTPlayer }) => void;
    onStateChange?: (e: { data: number; target: YTPlayer }) => void;
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function parseTimeInput(val: string): number {
  const parts = val.split(":").map(Number);
  if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
  return Number(val) || 0;
}

const H5P_LIBRARIES: Record<H5PType, string> = {
  MultiChoice: "H5P.MultiChoice 1.16",
  TrueFalse: "H5P.TrueFalse 1.6",
  FillBlanks: "H5P.Blanks 1.14",
  Matching: "H5P.Matching 1.0",
  DragText: "H5P.DragText 1.10",
  MarkWords: "H5P.MarkWords 1.9",
};

function makeTypeLabels(t: (key: string, fallback: string) => string): Record<H5PType, string> {
  return {
    MultiChoice: t("type.multiChoice", "Multiple Choice"),
    TrueFalse:   t("type.trueFalse",   "True / False"),
    FillBlanks:  t("type.fillBlanks",  "Fill in Blanks"),
    Matching:    t("type.matching",    "Matching"),
    DragText:    t("type.dragText",    "Drag Text"),
    MarkWords:   t("type.markWords",   "Mark Words"),
  };
}

const TYPE_COLORS: Record<H5PType, string> = {
  MultiChoice: "bg-blue-50   text-blue-700   border-blue-200   dark:bg-blue-900/40   dark:text-blue-300   dark:border-blue-700",
  TrueFalse:   "bg-green-50  text-green-700  border-green-200  dark:bg-green-900/40  dark:text-green-300  dark:border-green-700",
  FillBlanks:  "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700",
  Matching:    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700",
  DragText:    "bg-teal-50   text-teal-700   border-teal-200   dark:bg-teal-900/40   dark:text-teal-300   dark:border-teal-700",
  MarkWords:   "bg-amber-50  text-amber-700  border-amber-200  dark:bg-amber-900/40  dark:text-amber-300  dark:border-amber-700",
};

const TYPE_ICON_NAMES: Record<H5PType, string> = {
  MultiChoice: "ListChecks",
  TrueFalse:   "ToggleLeft",
  FillBlanks:  "PenLine",
  Matching:    "Shuffle",
  DragText:    "MoveHorizontal",
  MarkWords:   "Highlighter",
};

function makeTypeDescriptions(t: (key: string, fallback: string) => string): Record<H5PType, string> {
  return {
    MultiChoice: t("type.desc.multiChoice", "Lists, comparisons, or processes with one or more correct answers"),
    TrueFalse:   t("type.desc.trueFalse",   "Absolute facts or rules students confirm as true or false"),
    FillBlanks:  t("type.desc.fillBlanks",  "Key terms or definitions — students complete the blank"),
    Matching:    t("type.desc.matching",    "Recap pairs linking concepts to definitions (best at end)"),
    DragText:    t("type.desc.dragText",    "Ordered steps or sequences — students drag words into place"),
    MarkWords:   t("type.desc.markWords",   "Passages with key vocabulary — students click to highlight"),
  };
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type H5PType = "MultiChoice" | "TrueFalse" | "FillBlanks" | "Matching" | "DragText" | "MarkWords";

interface H5PForm {
  editingId: string | null;      // null = new, string = editing existing
  type: H5PType;
  timestamp: number;
  // MultiChoice
  question: string;
  choices: [string, string, string, string];
  correctIndices: number[];
  allowMultipleCorrect: boolean;
  // TrueFalse
  statement: string;
  tfCorrect: boolean;
  // FillBlanks  (text with *blank* markers)
  fillText: string;
  // Matching
  matchPairs: { prompt: string; answer: string }[];
  // DragText / MarkWords (shared structure)
  taskDescription: string;
  textField: string;
}

function blankForm(type: H5PType, timestamp: number): H5PForm {
  return {
    editingId: null, type, timestamp,
    question: "", choices: ["", "", "", ""], correctIndices: [0], allowMultipleCorrect: false,
    statement: "", tfCorrect: true, fillText: "",
    matchPairs: [{ prompt: "", answer: "" }, { prompt: "", answer: "" }, { prompt: "", answer: "" }],
    taskDescription: "", textField: "",
  };
}

function extractQuestionPreview(c: H5PContent): string {
  const p = (c.params || {}) as Record<string, unknown>;
  const q = (p.question || p.taskDescription || p.text || p.fillText || "") as string;
  if (q) return q.replace(/\*([^*]+)\*/g, "$1");
  if (Array.isArray(p.pairs) && p.pairs.length > 0) {
    const first = p.pairs[0] as { prompt?: string };
    return first.prompt ? `Match: ${first.prompt}…` : "";
  }
  return "";
}

function inferType(libraryOrType: string): H5PType {
  const s = (libraryOrType || "").toLowerCase();
  if (s.includes("multichoice") || s.includes("multiple")) return "MultiChoice";
  if (s.includes("truefalse") || s.includes("true")) return "TrueFalse";
  if (s.includes("blank") || s.includes("fill")) return "FillBlanks";
  if (s.includes("markwords") || s.includes("mark")) return "MarkWords";
  if (s.includes("matching")) return "Matching";
  if (s.includes("dragtext") || s.includes("drag")) return "DragText";
  return "MultiChoice";
}

function contentToForm(c: H5PContent): H5PForm {
  const type = inferType(c.library || "");
  const p = (c.params || {}) as Record<string, unknown>;
  const base = blankForm(type, c.timestamp);
  base.editingId = c.id;

  if (type === "MultiChoice") {
    const answers = (p.answers as Array<{ text: string; correct: boolean }>) || [];
    const correctIndices = answers.map((a, i) => a.correct ? i : -1).filter(i => i !== -1);
    return {
      ...base,
      question: (p.question as string) || "",
      choices: [
        answers[0]?.text || "", answers[1]?.text || "",
        answers[2]?.text || "", answers[3]?.text || "",
      ],
      correctIndices: correctIndices.length > 0 ? correctIndices : [0],
      allowMultipleCorrect: correctIndices.length > 1,
    };
  }
  if (type === "TrueFalse") {
    return {
      ...base,
      statement: ((p.question || p.statement) as string) || "",
      tfCorrect: p.correct === "true" || p.correct === true,
    };
  }
  if (type === "Matching") {
    const pairs = (p.pairs as Array<{ prompt: string; answer: string }>) || [];
    return { ...base, matchPairs: pairs.length > 0 ? pairs : base.matchPairs };
  }
  if (type === "DragText" || type === "MarkWords") {
    return {
      ...base,
      taskDescription: (p.taskDescription as string) || "",
      textField: (p.textField as string) || "",
    };
  }
  // FillBlanks
  return { ...base, fillText: (p.text as string) || "" };
}

function formToContentData(f: H5PForm) {
  let params: Record<string, unknown>;

  if (f.type === "MultiChoice") {
    params = {
      question: f.question,
      answers: f.choices
        .filter((c) => c.trim())
        .map((text, i) => ({ text, correct: f.correctIndices.includes(i) })),
    };
  } else if (f.type === "TrueFalse") {
    params = { question: f.statement, correct: f.tfCorrect ? "true" : "false" };
  } else if (f.type === "Matching") {
    params = { pairs: f.matchPairs.filter(p => p.prompt.trim() && p.answer.trim()) };
  } else if (f.type === "DragText" || f.type === "MarkWords") {
    params = { taskDescription: f.taskDescription, textField: f.textField };
  } else {
    params = { text: f.fillText, showSolutions: "end", autoCheck: false };
  }

  return {
    library: H5P_LIBRARIES[f.type],
    params,
    metadata: { title: `${f.type} @ ${formatTime(f.timestamp)}`, license: "U" },
  };
}

// ─── H5P Editor Panel ──────────────────────────────────────────────────────────

function H5PEditorPanel({
  h5pContents,
  currentTime,
  videoId,
  onSaved,
  onDeleted,
  onSeek,
  openForContent,
  clearOpen,
  onFormDirtyChange,
}: {
  h5pContents: H5PContent[];
  currentTime: number;
  videoId: string;
  onSaved: () => void;
  onFormDirtyChange?: (dirty: boolean) => void;
  onDeleted: (id: string) => void;
  onSeek: (t: number) => void;
  openForContent: H5PContent | null;
  clearOpen: () => void;
}) {
  const t = useT();
  const TYPE_LABELS = makeTypeLabels(t);
  const TYPE_DESCRIPTIONS = makeTypeDescriptions(t);
  const [form, setForm] = useState<H5PForm | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Notify parent when form open/close state changes
  useEffect(() => {
    onFormDirtyChange?.(form !== null);
  }, [form, onFormDirtyChange]);

  // Open editor when a dot is clicked
  useEffect(() => {
    if (openForContent) {
      setForm(contentToForm(openForContent));
      setSaveError(null);
    }
  }, [openForContent]);

  const startNew = (type: H5PType) => {
    setForm(blankForm(type, Math.floor(currentTime)));
    setFormDirty(false);
    setSaveError(null);
    setShowTypePicker(false);
    clearOpen();
  };

  const handleBack = () => {
    if (!form) { setShowTypePicker(false); return; }
    if (!form.editingId && formDirty) {
      setShowDiscardWarning(true);
    } else if (!form.editingId) {
      setForm(null);
      setFormDirty(false);
      setShowTypePicker(true);
    } else {
      cancel();
    }
  };

  const confirmDiscard = () => {
    setShowDiscardWarning(false);
    setForm(null);
    setFormDirty(false);
    setShowTypePicker(true);
  };

  const cancel = () => {
    setForm(null);
    setFormDirty(false);
    setShowDiscardWarning(false);
    setShowTypePicker(false);
    clearOpen();
  };

  const handleSave = async () => {
    if (!form) return;
    setSaveError(null);

    // Validate
    if (form.type === "MultiChoice") {
      if (!form.question.trim()) { setSaveError(t("editor.error.questionRequired", "Question is required.")); return; }
      if (form.choices.filter((c) => c.trim()).length < 2) { setSaveError(t("editor.error.optionsRequired", "At least 2 options required.")); return; }
    } else if (form.type === "TrueFalse") {
      if (!form.statement.trim()) { setSaveError(t("editor.error.statementRequired", "Statement is required.")); return; }
    } else if (form.type === "Matching") {
      const valid = form.matchPairs.filter(p => p.prompt.trim() && p.answer.trim());
      if (valid.length < 2) { setSaveError(t("editor.error.pairsRequired", "At least 2 complete pairs are required.")); return; }
    } else {
      if (!form.fillText.trim()) { setSaveError(t("editor.error.textBlanksRequired", "Text with blanks is required (use *word* for blanks).")); return; }
      if (!form.fillText.includes("*")) { setSaveError(t("editor.error.markRequired", "Mark at least one blank with *asterisks*.")); return; }
    }

    // Block duplicate timestamps (same second)
    const sameSecond = h5pContents.some(
      (c) => c.id !== form.editingId && Math.floor(c.timestamp) === Math.floor(form.timestamp)
    );
    if (sameSecond) {
      setSaveError(t("editor.error.duplicateTimestamp", "An interaction already exists at {{time}}. Choose a different second.").replace("{{time}}", formatTime(form.timestamp)));
      return;
    }

    setIsSaving(true);
    try {
      const contentData = formToContentData(form);
      if (form.editingId) {
        await updateH5PContent(form.editingId, contentData, form.timestamp);
      } else {
        await createH5PContent(videoId, contentData, form.timestamp);
      }
      onSaved();
      setForm(null);
      clearOpen();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form?.editingId) return;
    const id = form.editingId;
    onDeleted(id);
    setForm(null);
    clearOpen();
  };

  const setField = <K extends keyof H5PForm>(key: K, val: H5PForm[K]) => {
    setFormDirty(true);
    setForm((f) => f ? { ...f, [key]: val } : f);
  };

  const setChoice = (i: number, val: string) =>
    setForm((f) => {
      if (!f) return f;
      const choices = [...f.choices] as H5PForm["choices"];
      choices[i] = val;
      return { ...f, choices };
    });

  // ── Idle state ────────────────────────────────────────────────────────────
  if (!form) {
    // ── Type picker (full-panel) ───────────────────────────────────────────
    if (showTypePicker) {
      const iconMap = { ListChecks, ToggleLeft, PenLine, Shuffle, MoveHorizontal, Highlighter } as Record<string, React.ElementType>;
      return (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowTypePicker(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title={t("editor.back", "Back")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-sm font-bold text-slate-700">{t("editor.chooseQuestionType", "Choose question type")}</p>
              <p className="text-xs text-slate-400">{t("editor.selectFormat", "Select the format that best fits your content")}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {(["MultiChoice", "TrueFalse", "FillBlanks", "DragText", "MarkWords", "Matching"] as H5PType[]).map((type) => {
              const Icon = iconMap[TYPE_ICON_NAMES[type]];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => startNew(type)}
                  className="flex items-center gap-4 w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#f5832a]/40 dark:hover:border-[#f5832a]/30 hover:bg-[#fff8f4] dark:hover:bg-black/20 transition-all text-left group"
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${TYPE_COLORS[type]} group-hover:scale-105 transition-transform`}>
                    {Icon && <Icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-700 dark:text-gray-200 group-hover:text-[#f5832a] dark:group-hover:text-gray-400 transition-colors">{TYPE_LABELS[type]}</div>
                    <div className="text-xs text-slate-400 dark:text-gray-500 mt-0.5 leading-snug">{TYPE_DESCRIPTIONS[type]}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-gray-600 group-hover:text-[#f5832a] dark:group-hover:text-gray-500 shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // ── Interactions list ──────────────────────────────────────────────────
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {h5pContents.length > 0 ? `${t("editor.interactions", "Interactions")} (${h5pContents.length})` : t("editor.interactions", "Interactions")}
          </p>
          <button
            type="button"
            onClick={() => setShowTypePicker(true)}
            className="flex items-center gap-1.5 h-8 px-3 bg-[#f5832a] hover:bg-[#e86e15] dark:bg-transparent dark:border dark:border-[#f5832a] dark:hover:border-[#ffa05c] text-white text-xs font-bold rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("editor.addInteraction", "Add Interaction")}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {h5pContents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
              <Sparkles className="w-10 h-10 mb-3 text-slate-200" />
              <p className="font-semibold text-sm">{t("editor.noInteractionsYet", "No interactions yet")}</p>
              <p className="text-xs mt-1 text-center">{t("editor.noInteractionsHint", "Add one above, or run AI to generate them automatically.")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...h5pContents]
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((c, i) => {
                  const type = inferType(c.library || "");
                  const preview = extractQuestionPreview(c);
                  return (
                    <div
                      key={c.id}
                      onClick={() => setForm(contentToForm(c))}
                      className="flex items-start gap-3 p-3 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#f5832a] text-white text-xs font-bold flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLORS[type]}`}>
                            {TYPE_LABELS[type]}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onSeek(c.timestamp); }}
                            className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-xs font-bold text-slate-600 transition-colors"
                          >
                            <Clock className="w-3 h-3" />
                            {formatTime(c.timestamp)}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDeleted(c.id); }}
                            className="ml-auto p-1 text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title={t("editor.delete", "Delete")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {preview && (
                          <p className="text-xs text-slate-500 mt-1 truncate">{preview}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Form state (adding / editing) ──────────────────────────────────────────
  const isEditing = Boolean(form.editingId);

  return (
    <div className="flex flex-col h-full">
      {/* Discard warning banner */}
      {showDiscardWarning && (
        <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">{t("editor.discardChanges", "Discard changes?")}</p>
            <p className="text-xs text-amber-600 mt-0.5">{t("editor.discardDesc", "What you've typed will not be saved.")}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowDiscardWarning(false)} className="text-xs font-semibold text-amber-700 hover:text-amber-900 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors">{t("editor.keepEditing", "Keep editing")}</button>
            <button type="button" onClick={confirmDiscard} className="text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-2 py-1 rounded-lg transition-colors">{t("editor.discard", "Discard")}</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <button onClick={handleBack} title={t("editor.back", "Back")} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-bold text-slate-800 text-base">
            {isEditing ? t("editor.edit", "Edit") : t("editor.new", "New")} {TYPE_LABELS[form.type]}
          </h3>
          <p className="text-xs text-slate-500">
            {isEditing ? t("editor.updateBelow", "Update the interaction below") : t("editor.fillBelow", "Fill in the details below")}
          </p>
        </div>
        <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full border ${TYPE_COLORS[form.type]}`}>
          {TYPE_LABELS[form.type]}
        </span>
      </div>

      {/* Form fields */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Timestamp */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
            {t("editor.timestamp", "Timestamp")}
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={formatTime(form.timestamp)}
              onChange={(e) => setField("timestamp", parseTimeInput(e.target.value))}
              placeholder={t("editor.mmss", "MM:SS")}
              className="w-28 px-3 py-2 font-mono text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/30 focus:border-[#f5832a]"
            />
            <button
              type="button"
              onClick={() => setField("timestamp", Math.floor(currentTime))}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              {t("editor.useCurrent", "Use current")} ({formatTime(currentTime)})
            </button>
          </div>
        </div>

        {/* Multiple Choice */}
        {form.type === "MultiChoice" && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{t("editor.question", "Question")}</label>
              <textarea
                value={form.question}
                onChange={(e) => setField("question", e.target.value)}
                rows={3}
                placeholder={t("editor.questionPlaceholder", "What is the main idea of this segment?")}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/30 focus:border-[#f5832a] resize-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 mt-4">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t("editor.options", "Options")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="multi-correct-toggle"
                    checked={form.allowMultipleCorrect}
                    onChange={(e) => setField("allowMultipleCorrect", e.target.checked)}
                    className="rounded border-slate-300 text-[#f5832a] focus:ring-[#f5832a]/40 w-3.5 h-3.5"
                  />
                  <label htmlFor="multi-correct-toggle" className="text-xs font-semibold text-slate-600 cursor-pointer">
                    {t("editor.allowMultiple", "Allow multiple correct answers")}
                  </label>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-2">{t("editor.selectCorrectAnswers", "Select the correct answer(s)")}</p>
              <div className="space-y-2">
                {form.choices.map((choice, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (form.allowMultipleCorrect) {
                          setField(
                            "correctIndices",
                            form.correctIndices.includes(i)
                              ? form.correctIndices.filter((x) => x !== i)
                              : [...form.correctIndices, i]
                          );
                        } else {
                          setField("correctIndices", [i]);
                        }
                      }}
                      className={`w-6 h-6 shrink-0 flex items-center justify-center transition-all ${
                        form.allowMultipleCorrect ? "rounded-md" : "rounded-full"
                      } border-2 ${
                        form.correctIndices.includes(i)
                          ? "border-green-500 bg-green-500"
                          : "border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {form.correctIndices.includes(i) && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => setChoice(i, e.target.value)}
                      placeholder={`${t("editor.option", "Option")} ${i + 1}`}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/30 focus:border-[#f5832a]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* True / False */}
        {form.type === "TrueFalse" && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{t("editor.statement", "Statement")}</label>
              <textarea
                value={form.statement}
                onChange={(e) => setField("statement", e.target.value)}
                rows={3}
                placeholder={t("editor.statementPlaceholder", "Write a statement that is either true or false...")}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/30 focus:border-[#f5832a] resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{t("editor.correctAnswer", "Correct Answer")}</label>
              <div className="flex gap-3">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setField("tfCorrect", val)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                      form.tfCorrect === val
                        ? val
                          ? "border-green-500 bg-green-50 text-green-800"
                          : "border-red-400 bg-red-50 text-red-800"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {val ? t("editor.true", "True") : t("editor.false", "False")}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Fill in Blanks */}
        {form.type === "FillBlanks" && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              {t("editor.textWithBlanks", "Text with Blanks")}
            </label>
            <textarea
              value={form.fillText}
              onChange={(e) => setField("fillText", e.target.value)}
              rows={5}
              placeholder={t("editor.textWithBlanksPlaceholder", "The mitochondria is the *powerhouse* of the cell, and it produces *ATP*.")}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/30 focus:border-[#f5832a] resize-none font-mono"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              {t("editor.wrapBlanks", "Wrap words that should be blank with")} <code className="bg-slate-100 px-1 rounded font-mono">*{t("editor.asterisks", "asterisks")}*</code>
            </p>
            {form.fillText && (
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                <span className="text-xs font-semibold text-slate-500 block mb-1">{t("editor.preview", "Preview")}:</span>
                {form.fillText.split(/\*([^*]+)\*/).map((part, i) =>
                  i % 2 === 0
                    ? <span key={i}>{part}</span>
                    : <span key={i} className="inline-block min-w-16 border-b-2 border-[#f5832a] text-transparent bg-[#fff0e6] rounded px-1 mx-0.5 text-xs">____</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Matching */}
        {form.type === "Matching" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">{t("editor.matchPairs", "Match Pairs")}</label>
              {form.matchPairs.length < 4 && (
                <button
                  type="button"
                  onClick={() => setField("matchPairs", [...form.matchPairs, { prompt: "", answer: "" }])}
                  className="text-xs font-semibold text-[#1e3a5f] hover:text-[#2d5286] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> {t("editor.addPair", "Add pair")}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-3">{t("editor.matchHint", "Students drag the right column answers to match the left column prompts.")}</p>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 mb-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">{t("editor.prompt", "Prompt")}</span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">{t("editor.answer", "Answer")}</span>
              </div>
              {form.matchPairs.map((pair, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 items-center">
                  <input
                    type="text"
                    value={pair.prompt}
                    onChange={(e) => {
                      const updated = form.matchPairs.map((p, j) => j === i ? { ...p, prompt: e.target.value } : p);
                      setField("matchPairs", updated);
                    }}
                    placeholder={`${t("editor.prompt", "Prompt")} ${i + 1}`}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/30 focus:border-[#f5832a]"
                  />
                  <div className="flex gap-1 items-center">
                    <input
                      type="text"
                      value={pair.answer}
                      onChange={(e) => {
                        const updated = form.matchPairs.map((p, j) => j === i ? { ...p, answer: e.target.value } : p);
                        setField("matchPairs", updated);
                      }}
                      placeholder={`${t("editor.answer", "Answer")} ${i + 1}`}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/30 focus:border-[#f5832a]"
                    />
                    {form.matchPairs.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setField("matchPairs", form.matchPairs.filter((_, j) => j !== i))}
                        className="p-1.5 text-slate-400 hover:text-[#f5832a] transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drag Text */}
        {form.type === "DragText" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{t("editor.taskDescription", "Task Description")}</label>
              <input
                type="text"
                value={form.taskDescription}
                onChange={(e) => setField("taskDescription", e.target.value)}
                placeholder={t("editor.dragTextPlaceholder", "Drag the words to complete the sequence...")}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/30 focus:border-[#f5832a]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                {t("editor.textWithDraggable", "Text with Draggable Words")}
              </label>
              <textarea
                value={form.textField}
                onChange={(e) => setField("textField", e.target.value)}
                rows={5}
                placeholder={t("editor.dragTextFieldPlaceholder", "First *initialize* the connection, then *authenticate* the user, finally *authorize* access.")}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/30 focus:border-[#f5832a] resize-none font-mono"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                {t("editor.draggableWrap", "Wrap each draggable word in")} <code className="bg-slate-100 px-1 rounded font-mono">*{t("editor.asterisks", "asterisks")}*</code> — {t("editor.draggableWrapHint", "students drag them into the blanks")}
              </p>
              {form.textField && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">{t("editor.preview", "Preview")}:</span>
                  {form.textField.split(/\*([^*]+)\*/).map((part, i) =>
                    i % 2 === 0
                      ? <span key={i}>{part}</span>
                      : <span key={i} className="inline-block border border-[#1a4a3a] bg-[#e8f5f0] text-[#1a4a3a] rounded px-2 py-0.5 mx-0.5 text-xs font-semibold">{part}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mark Words */}
        {form.type === "MarkWords" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{t("editor.taskDescription", "Task Description")}</label>
              <input
                type="text"
                value={form.taskDescription}
                onChange={(e) => setField("taskDescription", e.target.value)}
                placeholder={t("editor.clickKeyTerms", "Click on all the key terms in this passage...")}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/30 focus:border-[#f5832a]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                {t("editor.textWithKeyTerms", "Text with Key Terms")}
              </label>
              <textarea
                value={form.textField}
                onChange={(e) => setField("textField", e.target.value)}
                rows={5}
                placeholder={t("editor.keyTermsPlaceholder", "In *photosynthesis*, plants use *chlorophyll* to convert sunlight into *glucose* and oxygen.")}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/30 focus:border-[#f5832a] resize-none font-mono"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                {t("editor.wrapKeyTerms", "Wrap each key term in")} <code className="bg-slate-100 px-1 rounded font-mono">*{t("editor.asterisks", "asterisks")}*</code> {t("editor.studentsClickHighlight", "students click to highlight them")}
              </p>
              {form.textField && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 leading-relaxed">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">{t("editor.preview", "Preview")}:</span>
                  {form.textField.split(/\*([^*]+)\*/).map((part, i) =>
                    i % 2 === 0
                      ? <span key={i}>{part}</span>
                      : <span key={i} className="inline-block bg-yellow-100 border border-yellow-400 text-yellow-900 rounded px-1.5 py-0.5 mx-0.5 text-xs font-semibold cursor-pointer hover:bg-yellow-200 transition-colors">{part}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {saveError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {saveError}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-5 border-t border-slate-100 flex items-center gap-2">
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[#f5832a] hover:bg-[#f5832a]/10 dark:hover:bg-[#f5832a]/10 border border-[#f5832a]/50 hover:border-[#f5832a] font-semibold rounded-xl transition-colors text-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t("action.delete", "Delete")}
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#2d5286] dark:bg-transparent dark:border dark:border-[#1e3a5f] dark:hover:border-[#3d6ba6] disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? t("editor.saving", "Saving...") : t("editor.saveInteraction", "Save Interaction")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Transcript Panel ──────────────────────────────────────────────────────────

function TranscriptPanel({
  segments,
  onSeek,
}: {
  segments: { start: number; end: number; text: string }[];
  onSeek: (t: number) => void;
}) {
  if (segments.length === 0) return null;

  return (
    <div className="space-y-0.5">
      {segments.map((seg, i) => (
        <button
          key={i}
          onClick={() => onSeek(seg.start)}
          className="w-full text-left flex gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm hover:bg-slate-50 border border-transparent group"
        >
          <span className="font-mono text-[11px] font-bold shrink-0 mt-0.5 text-slate-400 group-hover:text-slate-600">
            {formatTime(seg.start)}
          </span>
          <span className="leading-snug text-slate-700">{seg.text}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Topics Panel ─────────────────────────────────────────────────────────────

function TopicsPanel({
  topics,
  segments,
  onSeek,
}: {
  topics: TopicNode[];
  segments: { start: number; end: number; text: string }[];
  onSeek: (t: number) => void;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });

  if (topics.length === 0) return null;

  // Pull readable text from any question type
  function qText(q: { question?: string; fillText?: string; taskDescription?: string; textField?: string; statement?: string } | undefined): string {
    if (!q) return '';
    return (q.question || q.taskDescription || q.fillText || q.textField || q.statement || '').trim();
  }

  // Find transcript segments for a time range with ±3 s tolerance
  function segsFor(start: number, end: number) {
    return segments.filter((seg) => seg.start >= start - 3 && seg.start <= end + 3);
  }

  return (
    <div className="space-y-0.5 px-1">
      {topics.map((topic, ti) => {
        const tKey = `t${ti}`;
        const isTopicOpen = expanded.has(tKey);
        const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
        const topicQText = qText(topic.question as any);
        return (
          <div key={ti}>
            <button
              onClick={() => { toggle(tKey); onSeek(topic.start); }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-bold hover:bg-slate-50 text-slate-800"
            >
              {isTopicOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
              <span className="font-mono text-[11px] shrink-0 text-slate-400">{formatTime(topic.start)}–{formatTime(topic.end)}</span>
              <span className="truncate">{topic.title}</span>
            </button>
            {isTopicOpen && (
              <div className="ml-4 border-l border-slate-200 pl-2 space-y-0.5 mb-1">
                {hasSubtopics ? (
                  topic.subtopics!.map((sub, si) => {
                    const sKey = `t${ti}s${si}`;
                    const isSubOpen = expanded.has(sKey);
                    const subSegs = segsFor(sub.start, sub.end);
                    return (
                      <div key={si}>
                        <button
                          onClick={() => { toggle(sKey); onSeek(sub.start); }}
                          className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-xs font-semibold hover:bg-slate-50 text-slate-700"
                        >
                          {isSubOpen ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">{formatTime(sub.start)}–{formatTime(sub.end)}</span>
                          <span className="truncate">{sub.title}</span>
                        </button>
                        {isSubOpen && subSegs.length > 0 && (
                          <p className="ml-2 px-2 py-1 text-[11px] text-slate-500 leading-relaxed">
                            {subSegs.map(s => s.text).join(' ')}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (() => {
                  const topicSegs = segsFor(topic.start, topic.end);
                  return topicSegs.length > 0 ? (
                    <p className="px-2 py-1 text-[11px] text-slate-500 leading-relaxed">
                      {topicSegs.map(s => s.text).join(' ')}
                    </p>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Interaction Preview (student-facing popup) ────────────────────────────────

function InteractionPreview({
  content,
  onContinue,
}: {
  content: H5PContent;
  onContinue: () => void;
}) {
  const t = useT();
  const TYPE_LABELS = makeTypeLabels(t);
  const type = inferType(content.library || "");
  const p = (content.params || {}) as Record<string, unknown>;

  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [tfAnswer, setTfAnswer] = useState<boolean | null>(null);
  const [fillAnswer, setFillAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Matching state: map from promptIndex → selected answer string (dragged or clicked)
  const pairs = type === "Matching" ? ((p.pairs as Array<{ prompt: string; answer: string }>) || []) : [];
  const shuffledAnswers = useState(() => [...pairs].sort(() => Math.random() - 0.5))[0];
  const [matchSelections, setMatchSelections] = useState<Record<number, string>>({});
  const [draggingAnswer, setDraggingAnswer] = useState<string | null>(null);

  const handleSubmit = () => {
    if (type === "MultiChoice") {
      const answers = (p.answers as Array<{ text: string; correct: boolean }>) || [];
      const correctIndices = answers.map((a, i) => a.correct ? i : -1).filter(i => i !== -1);
      if (correctIndices.length === 0) {
        setIsCorrect(true);
      } else {
        setIsCorrect(
          selectedAnswers.length === correctIndices.length &&
          selectedAnswers.every(i => correctIndices.includes(i))
        );
      }
    } else if (type === "TrueFalse") {
      const correct = p.correct === true || p.correct === "true";
      setIsCorrect(tfAnswer === correct);
    } else if (type === "Matching") {
      const allCorrect = pairs.every((pair, i) => matchSelections[i]?.toLowerCase() === pair.answer.toLowerCase());
      setIsCorrect(allCorrect);
    } else if (type === "FillBlanks") {
      const text = (p.fillText as string) || (p.text as string) || "";
      const blanks = [...text.matchAll(/\*([^*]+)\*/g)].map((m) => m[1].trim().toLowerCase());
      const userParts = fillAnswer.trim().split(/\s+/);
      setIsCorrect(blanks.length > 0 && blanks.every((b) => userParts.some((u) => u.toLowerCase() === b)));
    } else {
      // DragText and MarkWords: correctness shown inline per item
      setIsCorrect(true);
    }
    setSubmitted(true);
  };

  const canSubmit =
    (type === "MultiChoice" && selectedAnswers.length > 0) ||
    (type === "TrueFalse" && tfAnswer !== null) ||
    (type === "Matching" && Object.keys(matchSelections).length === pairs.length && pairs.length > 0) ||
    (type === "FillBlanks" && fillAnswer.trim().length > 0) ||
    type === "DragText" ||
    type === "MarkWords";

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90%] overflow-y-auto">
      <div>
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${TYPE_COLORS[type]}`}>{TYPE_LABELS[type]}</span>
            <span className="text-xs text-slate-500 ml-auto font-mono">{formatTime(content.timestamp)}</span>
          </div>
        </div>

        {/* Question */}
        <div className="p-6 space-y-4">
          {type === "MultiChoice" && (() => {
            const answers = ((p.answers as Array<{ text: string; correct: boolean }>) || []);
            const isMultiple = answers.filter(a => a.correct).length > 1;
            return (
              <>
                <p className="font-semibold text-slate-800 text-[15px] leading-snug">{(p.question as string) || ""}</p>
                {isMultiple && <p className="text-xs text-[#1e3a5f] font-semibold mb-1">{t("editor.quiz.selectCorrect")}</p>}
                <div className="space-y-2">
                  {answers.map((ans, i) => (
                    <button
                      key={i}
                      disabled={submitted}
                      onClick={() => setSelectedAnswers(prev => isMultiple ? (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]) : [i])}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        submitted
                          ? ans.correct
                            ? "border-green-500 bg-green-50 text-green-800"
                            : selectedAnswers.includes(i)
                            ? "border-red-400 bg-red-50 text-red-800"
                            : "border-slate-200 text-slate-500"
                          : selectedAnswers.includes(i)
                          ? "border-[#f5832a] bg-[#fff0e6] text-[#1e3a5f]"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {ans.text}
                    </button>
                  ))}
                </div>
              </>
            );
          })()}

          {type === "TrueFalse" && (
            <>
              <p className="font-semibold text-slate-800 text-[15px] leading-snug">{(p.question as string) || (p.statement as string) || ""}</p>
              <div className="flex gap-3">
                {[true, false].map((val) => {
                  const correct = p.correct === true || p.correct === "true";
                  const isThisCorrect = val === correct;
                  return (
                    <button
                      key={String(val)}
                      disabled={submitted}
                      onClick={() => setTfAnswer(val)}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                        submitted
                          ? isThisCorrect
                            ? "border-green-500 bg-green-50 text-green-800"
                            : tfAnswer === val
                            ? "border-red-400 bg-red-50 text-red-800"
                            : "border-slate-200 text-slate-400"
                          : tfAnswer === val
                          ? val ? "border-green-400 bg-green-50 text-green-800" : "border-red-400 bg-red-50 text-red-800"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      {val ? t("editor.true") : t("editor.false")}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {type === "FillBlanks" && (() => {
            // AI stores the text in fillText; H5P import stores it in text
            const rawText = (p.fillText as string) || (p.text as string) || "";
            const parts = rawText.split(/\*([^*]+)\*/);
            const userAnswers = fillAnswer.trim().split(/\s+/);
            let blankIndex = 0;
            return (
              <>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fill in the blank(s)</p>
                <div className="text-[15px] text-slate-800 leading-relaxed">
                  {parts.map((part, i) => {
                    if (i % 2 === 0) return <span key={i}>{part}</span>;
                    const correctWord = part.trim();
                    const userWord = userAnswers[blankIndex++] ?? "";
                    const wordCorrect = userWord.toLowerCase() === correctWord.toLowerCase();
                    if (!submitted) {
                      return <span key={i} className="inline-block bg-slate-100 border-b-2 border-[#f5832a] px-2 min-w-16 text-slate-400 text-sm">___</span>;
                    }
                    return (
                      <span key={i} className="inline-flex flex-col items-center mx-1">
                        {!wordCorrect && userWord && (
                          <span className="text-xs line-through text-red-500 font-semibold">{userWord}</span>
                        )}
                        <span className="px-2 py-0.5 rounded font-bold text-sm bg-green-100 text-green-800">
                          {correctWord}
                        </span>
                      </span>
                    );
                  })}
                </div>
                {!submitted && (
                  <input
                    type="text"
                    value={fillAnswer}
                    onChange={(e) => setFillAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canSubmit && !submitted && handleSubmit()}
                    disabled={submitted}
                    placeholder="Type your answer..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f5832a]/30 focus:border-[#f5832a]"
                  />
                )}
              </>
            );
          })()}

          {type === "DragText" && (() => {
            const desc = (p.taskDescription as string) || "";
            const rawText = (p.textField as string) || "";
            // Words marked with *word* are the draggable answers
            const parts = rawText.split(/\*([^*]+)\*/);
            const correctWords = parts.filter((_, i) => i % 2 === 1).map(w => w.trim());
            const shuffled = useState(() => [...correctWords].sort(() => Math.random() - 0.5))[0];
            const [placed, setPlaced] = useState<(string | null)[]>(() => correctWords.map(() => null));
            const [dragging, setDragging] = useState<string | null>(null);
            const usedWords = placed.filter(Boolean) as string[];
            if (submitted) {
              return (
                <>
                  {desc && <p className="font-semibold text-slate-800 text-[15px] leading-snug">{desc}</p>}
                  <div className="text-[15px] text-slate-800 leading-relaxed">
                    {parts.map((part, i) => {
                      if (i % 2 === 0) return <span key={i}>{part}</span>;
                      const correct = part.trim();
                      const userWord = placed[Math.floor(i / 2)];
                      const ok = userWord?.toLowerCase() === correct.toLowerCase();
                      return <span key={i} className={`inline-block mx-1 px-2 py-0.5 rounded font-bold text-sm ${ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>{userWord || "___"}</span>;
                    })}
                  </div>
                </>
              );
            }
            return (
              <>
                {desc && <p className="font-semibold text-slate-800 text-[15px] leading-snug">{desc}</p>}
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {shuffled.map((w, i) => {
                    const used = usedWords.includes(w);
                    return (
                      <span key={i} draggable={!used} onDragStart={() => setDragging(w)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border cursor-grab select-none transition-all ${used ? "opacity-30 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400" : "bg-[#e8f0fa] border-[#1e3a5f]/20 text-[#1e3a5f] hover:bg-[#1e3a5f]/10"}`}>
                        {w}
                      </span>
                    );
                  })}
                </div>
                <div className="text-[15px] text-slate-800 leading-relaxed mt-2">
                  {parts.map((part, i) => {
                    if (i % 2 === 0) return <span key={i}>{part}</span>;
                    const slotIdx = Math.floor(i / 2);
                    const val = placed[slotIdx];
                    return (
                      <span key={i} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragging) { const n = [...placed]; n[slotIdx] = dragging; setPlaced(n); setDragging(null); } }}
                        className={`inline-block mx-1 min-w-16 px-2 py-0.5 rounded border-b-2 ${val ? "border-[#f5832a] text-[#1e3a5f] font-bold" : "border-[#f5832a] text-slate-400"} text-sm cursor-pointer`}
                        onClick={() => { if (val) { const n = [...placed]; n[slotIdx] = null; setPlaced(n); } }}>
                        {val || "___"}
                      </span>
                    );
                  })}
                </div>
              </>
            );
          })()}

          {type === "MarkWords" && (() => {
            const desc = (p.taskDescription as string) || "";
            const rawText = (p.textField as string) || "";
            const parts = rawText.split(/\*([^*]+)\*/);
            // Build set of correct words from between *...* markers, stripped of punctuation
            const stripPunct = (s: string) => s.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
            const correctWords = new Set(
              parts.filter((_, i) => i % 2 === 1).map(w => stripPunct(w))
            );
            // Render the text without asterisks, word by word
            const allWords = rawText.replace(/\*/g, '').split(/\s+/).filter(Boolean);
            const [marked, setMarked] = useState<Set<number>>(new Set());
            const toggleWord = (i: number) => {
              if (submitted) return;
              setMarked(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
            };
            return (
              <>
                {desc && <p className="font-semibold text-slate-800 text-[15px] leading-snug">{desc}</p>}
                <p className="text-xs text-slate-500">Click to highlight key words</p>
                <div className="text-[15px] text-slate-800 leading-relaxed flex flex-wrap gap-1">
                  {allWords.map((w, i) => {
                    const isCorrect = correctWords.has(stripPunct(w));
                    const isMarked = marked.has(i);
                    const bg = submitted
                      ? isCorrect && isMarked ? "bg-green-200 text-green-900"
                        : isCorrect ? "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-400"
                        : isMarked ? "bg-red-100 text-red-700"
                        : ""
                      : isMarked ? "bg-[#fff0e6] text-[#1e3a5f] ring-2 ring-[#f5832a]" : "hover:bg-slate-100";
                    return (
                      <span key={i} onClick={() => toggleWord(i)}
                        className={`px-1 py-0.5 rounded cursor-pointer transition-colors select-none ${bg}`}>
                        {w}
                      </span>
                    );
                  })}
                </div>
              </>
            );
          })()}

          {type === "Matching" && (
            <>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Drag or click an answer onto each prompt</p>
              {/* Answer bank */}
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-10">
                {shuffledAnswers.map((pair, i) => {
                  const used = Object.values(matchSelections).includes(pair.answer);
                  return (
                    <div
                      key={i}
                      draggable={!submitted && !used}
                      onDragStart={() => setDraggingAnswer(pair.answer)}
                      onDragEnd={() => setDraggingAnswer(null)}
                      onClick={() => {
                        if (submitted || used) return;
                        // Find first unmatched prompt
                        const firstEmpty = pairs.findIndex((_, pi) => matchSelections[pi] === undefined);
                        if (firstEmpty !== -1) setMatchSelections(prev => ({ ...prev, [firstEmpty]: pair.answer }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border cursor-grab transition-all select-none ${
                        used ? "opacity-30 cursor-not-allowed" : "bg-[#e8f0fa] border-[#1e3a5f]/20 text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
                      } ${draggingAnswer === pair.answer ? "opacity-50" : ""}`}
                    >
                      {pair.answer}
                    </div>
                  );
                })}
              </div>
              {/* Prompt drop targets */}
              <div className="space-y-2 mt-2">
                {pairs.map((pair, i) => {
                  const selected = matchSelections[i];
                  const isMatch = submitted && selected?.toLowerCase() === pair.answer.toLowerCase();
                  return (
                    <div
                      key={i}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggingAnswer && !submitted) {
                          // Remove this answer from any prior slot
                          const cleared = Object.fromEntries(Object.entries(matchSelections).filter(([, v]) => v !== draggingAnswer));
                          setMatchSelections({ ...cleared, [i]: draggingAnswer });
                          setDraggingAnswer(null);
                        }
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all ${
                        submitted
                          ? isMatch ? "border-green-400 bg-green-50" : "border-red-300 bg-red-50"
                          : selected ? "border-[#f5832a] bg-[#fff0e6]" : "border-dashed border-slate-300 bg-slate-50"
                      }`}
                    >
                      <span className="text-sm font-semibold text-slate-700 flex-1">{pair.prompt}</span>
                      <div className="flex items-center gap-1">
                        {selected ? (
                          <>
                            <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${submitted ? (isMatch ? "text-green-800" : "text-red-700") : "text-[#1e3a5f]"}`}>
                              {selected}
                            </span>
                            {!submitted && (
                              <button
                                onClick={() => setMatchSelections(prev => { const n = { ...prev }; delete n[i]; return n; })}
                                className="p-0.5 text-slate-400 hover:text-[#f5832a]"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 px-2">Drop here</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Feedback */}
          {submitted && (
            <div className={`flex items-start gap-2.5 p-3.5 rounded-xl text-sm font-medium ${
              isCorrect ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {isCorrect ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <X className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>
                {isCorrect
                  ? ((p.feedback as any)?.correct || "Correct! Well done.")
                  : "Incorrect"}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={onContinue}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            Skip
          </button>
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#2d5286] dark:bg-transparent dark:border dark:border-[#1e3a5f] dark:hover:border-[#3d6ba6] disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={onContinue}
              className="px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#2d5286] dark:bg-transparent dark:border dark:border-[#1e3a5f] dark:hover:border-[#3d6ba6] text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-1.5"
            >
              <ChevronRight className="w-4 h-4" /> Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ value, label, color = "bg-[#1e3a5f]" }: { value: number; label: string; color?: string }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
        <span className="font-medium truncate pr-2">{label}</span>
        <span className="font-mono font-bold shrink-0">{value}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Video Controls ────────────────────────────────────────────────────────────

function VideoControls({
  currentTime,
  duration,
  isPlaying,
  sortedContents,
  onSeek,
  onTogglePlay,
  onDotClick,
}: {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  sortedContents: H5PContent[];
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
  onDotClick: (c: H5PContent) => void;
}) {
  const t = useT();
  const TYPE_LABELS = makeTypeLabels(t);
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const currentTimeRef = useRef(currentTime);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);

  const getPctFromClientX = (clientX: number): number => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handleBarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (duration > 0) onSeek(getPctFromClientX(e.clientX) * duration);
  };

  const handleBarMouseMove = (e: React.MouseEvent) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(duration > 0 ? pct * duration : null);
    setHoverX(e.clientX - rect.left);
    if (isDragging && duration > 0) onSeek(pct * duration);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (duration > 0) onSeek(getPctFromClientX(e.clientX) * duration);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, duration, onSeek]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); onTogglePlay(); }
      if (e.code === "ArrowLeft") { e.preventDefault(); onSeek(Math.max(0, currentTimeRef.current - 5)); }
      if (e.code === "ArrowRight") { e.preventDefault(); onSeek(Math.min(duration, currentTimeRef.current + 5)); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [duration, onTogglePlay, onSeek]);

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="bg-[#1e3a5f] px-4 py-3 select-none rounded-b-2xl">
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          className="shrink-0 w-8 h-8 flex items-center justify-center text-white hover:text-orange-400 transition-colors"
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* Current time */}
        <span className="text-slate-300 text-[11px] font-mono shrink-0 w-10 text-center">
          {formatTime(currentTime)}
        </span>

        {/* Progress bar */}
        <div
          ref={barRef}
          className="relative flex-1 h-2 bg-slate-600 rounded-full cursor-pointer group"
          onMouseDown={handleBarMouseDown}
          onMouseMove={handleBarMouseMove}
          onMouseLeave={() => { setHoverTime(null); if (isDragging) setIsDragging(false); }}
        >
          {/* Filled portion */}
          <div
            className="absolute top-0 left-0 h-full bg-slate-400 rounded-full pointer-events-none transition-[width] duration-100"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
          {/* Playhead thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow pointer-events-none transition-opacity"
            style={{
              left: `${Math.min(100, progress * 100)}%`,
              opacity: hoverTime !== null || isDragging ? 1 : 0,
            }}
          />
          {/* Hover time tooltip */}
          {hoverTime !== null && duration > 0 && (
            <div
              className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded pointer-events-none -translate-x-1/2 whitespace-nowrap border border-slate-700 shadow-lg"
              style={{ left: `${hoverX}px` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
          {/* H5P numbered dots */}
          {duration > 0 && sortedContents.map((c, i) => {
            const pct = Math.min(100, Math.max(0, (c.timestamp / duration) * 100));
            return (
              <button
                key={c.id}
                style={{ left: `${pct}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 group/dot"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onSeek(c.timestamp); onDotClick(c); }}
                title={`#${i + 1} ${TYPE_LABELS[inferType(c.library || "")]} @ ${formatTime(c.timestamp)}`}
              >
                <div className="w-5 h-5 rounded-full bg-[#f5832a] border-2 border-white text-white text-[9px] font-bold flex items-center justify-center shadow-lg hover:scale-125 transition-transform hover:bg-[#e86e15]">
                  {i + 1}
                </div>
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none shadow-lg border border-slate-700">
                  {formatTime(c.timestamp)} — {TYPE_LABELS[inferType(c.library || "")]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Duration */}
        <span className="text-slate-500 text-[11px] font-mono shrink-0 w-10 text-center">
          {duration > 0 ? formatTime(duration) : "--:--"}
        </span>

      </div>
    </div>
  );
}

// ─── Main Editor ───────────────────────────────────────────────────────────────

export default function Editor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { token } = useAuthStore();
  const store = useEditorStore();
  const t = useT();
  const TYPE_LABELS = makeTypeLabels(t);

  const [currentStep, setCurrentStep] = useState(1);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [activeUploadTab, setActiveUploadTab] = useState<"file" | "youtube" | "h5p">("file");
  const [pendingH5PFile, setPendingH5PFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isExtractingTranscript, setIsExtractingTranscript] = useState(false);
  const [isImportingH5P, setIsImportingH5P] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [openForContent, setOpenForContent] = useState<H5PContent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clickFlash, setClickFlash] = useState<"play" | "pause" | null>(null);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [showAIConfirm, setShowAIConfirm] = useState(false);
  const [pendingAIAction, setPendingAIAction] = useState<(() => void) | null>(null);
  const [aiUsage, setAiUsage] = useState<{ usedToday: number; limit: number | null; isAdmin: boolean } | null>(null);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const aiIsRunning = isExtractingTranscript || store.isAnalyzing || store.injectProgress > 0;
  const aiIsDone = !aiIsRunning && store.analysisProgress === 100;
  let aiUnifiedProgress = 0;
  let aiUnifiedMessage = "";
  if (isExtractingTranscript) {
    aiUnifiedProgress = 20;
    aiUnifiedMessage = t("editor.transcribing", "Transcribing video...");
  } else if (store.isAnalyzing) {
    aiUnifiedProgress = 25 + Math.round((store.analysisProgress / 100) * 60);
    aiUnifiedMessage = store.progressMessage || "AI is generating questions...";
  } else if (store.injectProgress > 0) {
    aiUnifiedProgress = 85 + Math.round((store.injectProgress / 100) * 15);
    aiUnifiedMessage = t("editor.applyingH5P", "Applying H5P interactions...");
  }

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);
  const h5pStep1InputRef = useRef<HTMLInputElement>(null);
  const analysisCleanupRef = useRef<(() => void) | null>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Processing status poller (clears when component unmounts or video becomes ready)
  const processingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // YouTube IFrame API
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const ytPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);

  // Interaction preview (student-facing popup)
  const [previewContent, setPreviewContent] = useState<H5PContent | null>(null);
  const triggeredTimestampsRef = useRef<Set<number>>(new Set());

  // ── Resizable 3-column layout ──────────────────────────────────────────────
  const COL_STORAGE_KEY = 'editor-col-widths-v1';
  const COL_DEFAULTS: [number, number, number] = [22, 45, 33];
  const COL_MIN = 12; // minimum % for any column

  const [colWidths, setColWidths] = useState<[number, number, number]>(() => {
    try {
      const saved = localStorage.getItem(COL_STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved) as number[];
        if (p.length === 3 && p.every(n => typeof n === 'number' && n > 0)) return p as [number, number, number];
      }
    } catch { /* ignore */ }
    return COL_DEFAULTS;
  });

  const [isWideLayout, setIsWideLayout] = useState(() => window.innerWidth >= 1280);
  const colContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setIsWideLayout(window.innerWidth >= 1280);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const startColDrag = useCallback((dividerIdx: 0 | 1, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths: [number, number, number] = [...colWidths] as [number, number, number];
    const containerWidth = colContainerRef.current?.offsetWidth ?? 1;

    const clamp = (v: number) => Math.max(COL_MIN, Math.min(100 - COL_MIN * 2, v));

    const onMove = (ev: MouseEvent) => {
      const deltaPct = ((ev.clientX - startX) / containerWidth) * 100;
      setColWidths(() => {
        const w: [number, number, number] = [...startWidths];
        if (dividerIdx === 0) {
          // Adjust only column 0 and 1, keep column 2 fixed
          const new0 = clamp(startWidths[0] + deltaPct);
          const delta0 = new0 - startWidths[0];
          let new1 = Math.max(COL_MIN, startWidths[1] - delta0);
          if (new1 < COL_MIN) {
            new1 = COL_MIN;
            w[0] = Math.max(COL_MIN, 100 - startWidths[2] - new1);
            w[1] = new1;
          } else {
            w[0] = new0;
            w[1] = new1;
          }
          w[2] = startWidths[2];
        } else {
          // Adjust only column 1 and 2, keep column 0 fixed
          const new2 = clamp(startWidths[2] - deltaPct);
          const delta2 = new2 - startWidths[2];
          let new1 = Math.max(COL_MIN, startWidths[1] + delta2);
          if (new1 < COL_MIN) {
            new1 = COL_MIN;
            w[2] = Math.max(COL_MIN, 100 - startWidths[0] - new1);
            w[1] = new1;
          } else {
            w[2] = new2;
            w[1] = new1;
          }
          w[0] = startWidths[0];
        }
        // normalize to avoid tiny rounding errors that may cause horizontal scroll
        const total = w[0] + w[1] + w[2];
        if (Math.abs(total - 100) > 0.001) {
          w[1] = Math.max(COL_MIN, 100 - w[0] - w[2]);
        }
        return w;
      });
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setColWidths(prev => { localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(prev)); return prev; });
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    // hide page scrollbars while dragging so viewport width doesn't change
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    const restoreOverflow = () => { document.body.style.overflow = prevOverflow; document.removeEventListener('mouseup', restoreOverflow); };
    document.addEventListener('mouseup', restoreOverflow);
  }, [colWidths]);
  const prevTimeRef = useRef(0);

  // Ref to latest h5pContents so YouTube polling never reads stale closure
  const h5pContentsRef = useRef(store.h5pContents);
  useEffect(() => { h5pContentsRef.current = store.h5pContents; }, [store.h5pContents]);

  // Ref to latest videoDuration so YouTube polling doesn't keep the initial 0
  const videoDurationRef = useRef(0);

  useEffect(() => { if (!token) navigate("/"); }, [token, navigate]);

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  // Close share menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // hasUnsavedChanges is now driven by the interaction form being open (set via onFormDirtyChange)
  // Warn on browser refresh/close only when form is open
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Intercept browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (hasUnsavedChanges && currentStep === 2) {
        window.history.pushState(null, "", window.location.href);
        setShowUnsavedWarning(true);
      }
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [hasUnsavedChanges, currentStep]);

  useEffect(() => {
    fetchAIUsage().then(setAiUsage).catch(() => {});
  }, []);

  const prevIsAnalyzing = useRef(false);
  useEffect(() => {
    if (prevIsAnalyzing.current && !store.isAnalyzing) {
      fetchAIUsage().then(setAiUsage).catch(() => {});
    }
    prevIsAnalyzing.current = store.isAnalyzing;
  }, [store.isAnalyzing]);

  useEffect(() => {
    if (!id) {
      store.resetEditor();
      setCurrentStep(1);
      return;
    }
    const load = async () => {
      store.resetEditor();
      try {
        const video = await fetchVideo(id);
        store.setVideo(video);
        // captions may be a JSON string or already an object
        let captionData = video.captions;
        if (typeof captionData === 'string') {
          try { captionData = JSON.parse(captionData); } catch { captionData = null; }
        }
        if (captionData && typeof captionData === 'object') {
          if ('topics' in (captionData as object)) {
            store.setTopics((captionData as any).topics || []);
          }
          if ('segments' in (captionData as object)) {
            store.setSegments((captionData as any).segments || []);
          }
        }
        recordVideoVisit(id);
        await store.loadH5PContents(id);
        setCurrentStep(2);
        if (video.status === 'processing') startProcessingPoll(id);
      } catch {
        notify("Could not load video.", "error");
      }
    };
    load();
  }, [id]);

  useEffect(() => () => {
    analysisCleanupRef.current?.();
    store.resetAnalysis();
  }, []);

  // YouTube IFrame API setup
  useEffect(() => {
    const youtubeId = store.video?.youtubeId;
    if (!youtubeId || currentStep !== 2) return;

    const startPolling = (player: YTPlayer) => {
      if (ytPollRef.current) clearInterval(ytPollRef.current);
      ytPollRef.current = setInterval(() => {
        const t = player.getCurrentTime();
        store.setCurrentTime(t);
        // Use ref so we always have latest h5pContents — avoids stale closure
        checkInteractionTriggerWithRef(t);

        if (videoDurationRef.current === 0) {
          const dur = player.getDuration();
          if (dur > 0) { setVideoDuration(dur); videoDurationRef.current = dur; }
        }
      }, 300);
    };

    const initPlayer = () => {
      if (!ytContainerRef.current) return;
      if (ytPlayerRef.current) { ytPlayerRef.current.destroy(); }
      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1, controls: 0, disablekb: 1 },
        events: {
          onReady: ({ target }) => {
            const dur = target.getDuration();
            if (dur > 0) setVideoDuration(dur);
          },
          onStateChange: ({ data, target }) => {
            if (data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startPolling(target);
            } else {
              setIsPlaying(false);
              if (ytPollRef.current) clearInterval(ytPollRef.current);
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); initPlayer(); };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
    }

    return () => {
      if (ytPollRef.current) clearInterval(ytPollRef.current);
      if (processingPollRef.current) clearInterval(processingPollRef.current);
      ytPlayerRef.current?.destroy();
      ytPlayerRef.current = null;
    };
  }, [store.video?.youtubeId, currentStep]);

  const notify = (msg: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const startProcessingPoll = (videoId: string) => {
    if (processingPollRef.current) clearInterval(processingPollRef.current);
    const deadline = Date.now() + 10 * 60 * 1000; // stop after 10 min
    processingPollRef.current = setInterval(async () => {
      if (Date.now() > deadline) {
        clearInterval(processingPollRef.current!);
        return;
      }
      try {
        const updated = await fetchVideo(videoId);
        if (updated.status === 'ready' || updated.status === 'error') {
          clearInterval(processingPollRef.current!);
          processingPollRef.current = null;
          store.setVideo(updated);
        }
      } catch {
        clearInterval(processingPollRef.current!);
        processingPollRef.current = null;
      }
    }, 4000);
  };

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
      recordVideoVisit(video.id);
      await store.loadH5PContents(video.id);
      setCurrentStep(2);
      if (video.status === 'processing') startProcessingPoll(video.id);
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
      recordVideoVisit(video.id);
      await store.loadH5PContents(video.id);
      setCurrentStep(2);
      notify("YouTube video imported!", "success");
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
      notify(`Parsed ${segments.length} segments from "${file.name}"`, "success");
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Failed to parse transcript", "error");
    }
  };

  const handleH5PFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setPendingH5PFile(file);
  };

  const handleContinueToStep2 = async () => {
    if (pendingH5PFile) {
      setIsImportingH5P(true);
      try {
        const { video } = await uploadH5PFile(pendingH5PFile, store.video?.id);
        store.setVideo(video);
        recordVideoVisit(video.id);
        await store.loadH5PContents(video.id);
        setPendingH5PFile(null);
      } catch (err: unknown) {
        notify(err instanceof Error ? err.message : "H5P import failed", "error");
        setIsImportingH5P(false);
        return;
      }
      setIsImportingH5P(false);
    }
    setCurrentStep(2);
  };


  const handleTranscriptExtraction = async () => {
    if (!store.video?.id) return;
    setIsExtractingTranscript(true);
    try {
      const segments = await extractTranscriptFromVideo(store.video.id);
      store.setSegments(segments);
      store.setTranscriptFilename("Auto-extracted from YouTube");
      notify(`Extracted ${segments.length} segments`, "success");
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Extraction failed", "error");
    } finally {
      setIsExtractingTranscript(false);
    }
  };

  const handleWhisperTranscribe = async () => {
    if (!store.video?.id) return;
    setIsExtractingTranscript(true);
    try {
      const segments = await whisperTranscribeVideo(store.video.id);
      store.setSegments(segments);
      store.setTranscriptFilename("Transcribed with Whisper AI");
      notify(`Transcribed ${segments.length} segments`, "success");
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Whisper transcription failed", "error");
    } finally {
      setIsExtractingTranscript(false);
    }
  };

  const deleteAllAndRun = async (action: () => void) => {
    for (const c of store.h5pContents) {
      await store.removeH5PContent(c.id);
    }
    action();
  };

  const guardAI = (action: () => void) => {
    if (store.h5pContents.length > 0) {
      setPendingAIAction(() => () => deleteAllAndRun(action));
      setShowAIConfirm(true);
    } else {
      action();
    }
  };

  const handleRunAnalysis = () => {
    if (!store.video?.id) return;
    guardAI(() => {
      analysisCleanupRef.current?.();
      const cleanup = store.runAnalysis(store.video!.id, i18n.language);
      analysisCleanupRef.current = cleanup;
    });
  };

  // Combined: transcribe → then AI analyze → then inject
  const handleTranscribeAndGenerate = async () => {
    if (!store.video?.id) return;
    guardAI(async () => {
    notify("AI results may be inaccurate or low quality. Please review all generated content before publishing.", "info");
    setIsExtractingTranscript(true);
    try {
      let segments;
      const lang = i18n.language || 'en';
      const useWhisper = lang !== 'en';
      if (store.video.youtubeId && !useWhisper) {
        // English UI: try YouTube's own captions first (fast, no audio download needed)
        try {
          segments = await extractTranscriptFromVideo(store.video.id);
          store.setTranscriptFilename("Extracted from YouTube captions");
        } catch {
          // No captions — fall back to Whisper
          segments = await whisperTranscribeVideo(store.video.id, 'base', lang);
          store.setTranscriptFilename("Transcribed with Whisper AI");
        }
      } else {
        // Non-English UI: always use Whisper with the explicit language so the
        // transcript is produced in the audio's language, not YouTube's English captions
        segments = await whisperTranscribeVideo(store.video.id, 'base', lang);
        store.setTranscriptFilename("Transcribed with Whisper AI");
      }
      store.setSegments(segments);
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Transcription failed", "error");
      setIsExtractingTranscript(false);
      return;
    }
    setIsExtractingTranscript(false);
    // Segments are now in store — kick off AI analysis
    analysisCleanupRef.current?.();
    const cleanup = store.runAnalysis(store.video!.id, i18n.language);
    analysisCleanupRef.current = cleanup;
    });
  };

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

  // Core logic — reads from ref so it's always fresh regardless of when called
  const checkInteractionTriggerWithRef = useCallback((t: number) => {
    const prev = prevTimeRef.current;
    if (t < prev - 1) {
      triggeredTimestampsRef.current.forEach((ts) => {
        if (ts > t) triggeredTimestampsRef.current.delete(ts);
      });
    }
    prevTimeRef.current = t;

    for (const c of h5pContentsRef.current) {
      const ts = Math.floor(c.timestamp);
      if (!triggeredTimestampsRef.current.has(ts) && Math.floor(t) >= ts && Math.floor(t) < ts + 2) {
        triggeredTimestampsRef.current.add(ts);
        if (videoRef.current) videoRef.current.pause();
        if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
        setPreviewContent(c);
        break;
      }
    }
  }, []); // stable — reads h5pContentsRef.current at call time

  // Alias used by local video onTimeUpdate (same function, named for clarity)
  const checkInteractionTrigger = checkInteractionTriggerWithRef;

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
      // isPlaying updated via onPlay/onPause events
    } else if (ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
      } else {
        ytPlayerRef.current.playVideo();
      }
    }
  }, [isPlaying]);

  const flashAndToggle = useCallback(() => {
    setClickFlash(isPlaying ? "pause" : "play");
    setTimeout(() => setClickFlash(null), 600);
    togglePlay();
  }, [isPlaying, togglePlay]);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {});
    }
    if (ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(time, true);
      ytPlayerRef.current.playVideo();
    }
    // Clear triggers for times after the seek target
    triggeredTimestampsRef.current.forEach((ts) => {
      if (ts >= time) triggeredTimestampsRef.current.delete(ts);
    });
  }, []);

  const videoSrc = store.video?.filePath
    ? `/api/uploads/${store.video.filePath.replace(/^uploads[\\/]/, "")}`
    : null;


  // Sorted h5p contents for numbered dots
  const sortedContents = [...store.h5pContents].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
        {/* Left — title */}
        <div>
          {isTitleEditing ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={async () => {
                if (store.video && titleDraft.trim() && titleDraft.trim() !== store.video.title) {
                  try {
                    const updated = await updateVideoTitle(store.video.id, titleDraft.trim());
                    store.setVideo(updated);
                    notify("Title updated!", "success");
                  } catch (err) {
                    notify(err instanceof Error ? err.message : "Failed to update title", "error");
                  }
                }
                setIsTitleEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setIsTitleEditing(false);
              }}
              title="Video title"
              placeholder="Video title"
              className="text-xl font-bold text-slate-800 border-b-2 border-[#f5832a] bg-transparent outline-none px-1 w-64"
            />
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">{store.video?.title || "New Interactive Video"}</h2>
              {store.video && (
                <button
                  type="button"
                  onClick={() => { setTitleDraft(store.video!.title || ""); setIsTitleEditing(true); }}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                  title="Rename video"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-slate-500 hidden sm:block">{store.video ? `ID: ${store.video.id}` : "No video loaded"}</p>
        </div>

        {/* Right — Share dropdown + Home */}
        <div className="flex items-center gap-2">
          {store.video && (
            <div ref={shareMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShareMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 h-9 px-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Link className="w-4 h-4" />
                {t("editor.share", "Share")}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${shareMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {shareMenuOpen && (
                <div className="absolute right-0 top-11 w-52 bg-white border border-slate-200 rounded-2xl shadow-lg py-1 z-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const ltiUrl = `${window.location.origin}/api/lti/launch/${store.video!.id}`;
                      navigator.clipboard.writeText(ltiUrl);
                      notify("LTI link copied!", "success");
                      setShareMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Link className="w-4 h-4 text-slate-400" />
                    {t("editor.copyLtiLink", "Copy LTI Link")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleExport(); setShareMenuOpen(false); }}
                    disabled={isExporting || store.h5pContents.length === 0}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <Download className="w-4 h-4 text-slate-400" />}
                    {t('editor.downloadH5p', 'Download .h5p')}
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (currentStep === 2 && hasUnsavedChanges) {
                setShowUnsavedWarning(true);
              } else {
                window.dispatchEvent(new CustomEvent('dashboard-refresh'));
                navigate("/app/dashboard");
              }
            }}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-semibold bg-[#1e3a5f] hover:bg-[#2d5286] dark:bg-transparent dark:border dark:border-[#1e3a5f] dark:hover:border-[#3d6ba6] text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            {t('action.home', 'Home')}
          </button>
        </div>
      </header>

      {/* ── Save Progress Dialog ───────────────────────────────────────────── */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-slate-800">{t('editor.saveProgress', 'Save progress?')}</h2>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              {t('editor.homeHint', 'Your interactions will remain saved on the server. Choose Save to confirm and go home, or Cancel to keep editing.')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowUnsavedWarning(false)}
                className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                {t('action.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => { setHasUnsavedChanges(false); setShowUnsavedWarning(false); window.dispatchEvent(new CustomEvent('dashboard-refresh')); navigate("/app/dashboard?saved=1"); }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#1e3a5f] hover:bg-[#2d5286] dark:bg-transparent dark:border dark:border-[#1e3a5f] dark:hover:border-[#3d6ba6] text-white rounded-xl transition-colors"
              >
                <Save className="w-4 h-4" />
                {t('action.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-semibold animate-in slide-in-from-top-2 duration-300 ${
          notification.type === "success" ? "bg-green-600 text-white" :
          notification.type === "error" ? "bg-red-600 text-white" : "bg-slate-800 text-white"
        }`}>
          {notification.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {notification.msg}
          <button onClick={() => setNotification(null)}><X className="w-4 h-4 opacity-70 hover:opacity-100" /></button>
        </div>
      )}

      {/* ── AI Confirmation Dialog ─────────────────────────────────────────── */}
      {showAIConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-slate-800">{t("editor.replaceQuestions", "Replace existing questions?")}</h2>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              This will permanently delete all <strong>{store.h5pContents.length} existing question{store.h5pContents.length !== 1 ? 's' : ''}</strong> and generate a new set with AI. This cannot be undone.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
              {t("editor.aiWarning", "⚠️ AI results may be inaccurate or low quality. Please review all generated content before publishing.")}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowAIConfirm(false); setPendingAIAction(null); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {t("action.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={() => { setShowAIConfirm(false); pendingAIAction?.(); setPendingAIAction(null); }}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#f5832a] hover:bg-[#e86e15] dark:bg-transparent dark:border dark:border-[#f5832a] dark:hover:border-[#ffa05c] text-white transition-colors"
              >
                {t("editor.deleteAndRegenerate", "Delete & Regenerate")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden p-4 sm:p-6 w-full flex flex-col min-h-0">
        <div className="w-full flex flex-col gap-5 flex-1 min-h-0">

          {/* ── STEP 1: Upload ───────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="bg-white dark:bg-[#242424] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-8 sm:p-12 animate-fade-in">
              <div className="text-center max-w-xl mx-auto mb-10">
                <h1 className="text-2xl font-bold text-[#1e3a5f] dark:text-white mb-2">{t("editor.addYourVideo", "Add your video")}</h1>
                <p className="text-slate-500 dark:text-gray-400 text-sm">{t("editor.addYourVideoDesc", "Upload a file, paste a YouTube link, or import an H5P package.")}</p>
              </div>

              {/* Tab switcher */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex bg-slate-100 dark:bg-[#1a1a1a] p-1 rounded-xl gap-0.5">
                  {(["file", "youtube", "h5p"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveUploadTab(tab)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                        activeUploadTab === tab
                          ? "bg-white dark:bg-[#2e2e2e] text-[#1e3a5f] dark:text-white shadow-sm"
                          : "text-slate-500 dark:text-gray-300/50 hover:text-slate-800 dark:hover:text-gray-200"
                      }`}
                    >
                      {tab === "file" ? <UploadCloud className="w-4 h-4" /> : tab === "youtube" ? <Youtube className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                      {tab === "file" ? t("editor.uploadFile", "Upload File") : tab === "youtube" ? t("editor.youtubeLink", "YouTube Link") : t("editor.h5pPackage", "H5P Package")}
                    </button>
                  ))}
                </div>
              </div>

              {uploadError && (
                <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm max-w-lg mx-auto animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {uploadError}
                </div>
              )}

              {/* File upload dropzone */}
              {activeUploadTab === "file" && (
                <>
                  <input ref={fileInputRef} type="file" accept="video/*" onChange={handleVideoFileUpload} className="hidden" title="Upload video file" aria-label="Upload video file" />
                  <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 group ${
                      isUploading
                        ? "border-[#f5832a]/60 bg-[#fff0e6] dark:bg-[#f5832a]/5 cursor-wait"
                        : "border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-[#1a1a1a]/40 hover:border-[#f5832a] hover:bg-[#fff0e6]/40 dark:hover:bg-[#f5832a]/5 cursor-pointer"
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform duration-200 ${
                      isUploading ? "bg-[#fff0e6] dark:bg-[#f5832a]/10" : "bg-slate-100 dark:bg-[#2e2e2e] group-hover:scale-110 group-hover:bg-[#fff0e6] dark:group-hover:bg-[#f5832a]/10"
                    }`}>
                      {isUploading
                        ? <Loader2 className="w-8 h-8 text-[#f5832a] animate-spin" />
                        : <UploadCloud className="w-8 h-8 text-slate-500 dark:text-gray-400 group-hover:text-[#f5832a]" />
                      }
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                      {isUploading ? t("editor.uploading", "Uploading…") : t("editor.clickToUploadVideo", "Click to upload a video")}
                    </h3>
                    <p className="text-sm text-slate-400 dark:text-gray-300/40 mb-5">{t("editor.videoFormats", "MP4, WebM, or OGG · up to 5 GB")}</p>
                    {isUploading && (
                      <div className="w-full max-w-xs mx-auto bg-slate-200 dark:bg-[#2e2e2e] rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#f5832a] h-1.5 rounded-full animate-pulse w-1/2" />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* YouTube URL */}
              {activeUploadTab === "youtube" && (
                <div className="max-w-xl mx-auto">
                  <label className="block text-sm font-semibold text-[#1e3a5f] dark:text-gray-300 mb-2">{t("editor.youtubeUrl", "YouTube URL")}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Youtube className="w-4 h-4 text-slate-400 group-focus-within:text-[#f5832a] transition-colors" />
                    </div>
                    <input
                      type="url"
                      value={youtubeLink}
                      onChange={(e) => setYoutubeLink(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleYoutubeImport()}
                      placeholder={t("editor.youtubePlaceholder", "https://www.youtube.com/watch?v=…")}
                      className="w-full pl-10 pr-4 py-3 bg-[#f0f4f8] dark:bg-[#2e2e2e] border border-transparent dark:border-white/10 rounded-xl text-[#1e3a5f] dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] focus:bg-white dark:focus:bg-[#333333] transition-all text-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-gray-300/40 mt-2">
                    {t("editor.youtubeHint", "Paste a YouTube URL then click Continue")}
                  </p>
                  {isUploading && <ProgressBar value={60} label={t("editor.importingYoutube", "Importing YouTube video…")} color="bg-[#f5832a]" />}
                </div>
              )}

              {/* H5P package */}
              {activeUploadTab === "h5p" && (
                <>
                  <input ref={h5pStep1InputRef} type="file" accept=".h5p" onChange={handleH5PFileSelect} className="hidden" title="Upload H5P package" aria-label="Upload H5P package" />
                  <div
                    onClick={() => h5pStep1InputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 group cursor-pointer ${
                      pendingH5PFile
                        ? "border-green-400/60 dark:border-green-500/40 bg-green-50/50 dark:bg-green-900/10"
                        : "border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-[#1a1a1a]/40 hover:border-[#f5832a] hover:bg-[#fff0e6]/40 dark:hover:bg-[#f5832a]/5"
                    }`}
                  >
                    {pendingH5PFile ? (
                      <>
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1 truncate max-w-xs mx-auto">{pendingH5PFile.name}</h3>
                        <p className="text-sm text-slate-400 dark:text-gray-300/40 mb-5">{t("editor.h5pPackageReady", "H5P package ready to import")}</p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPendingH5PFile(null); }}
                          className="px-4 py-1.5 bg-white dark:bg-[#2e2e2e] border border-slate-300 dark:border-white/10 hover:border-red-300 hover:text-red-600 dark:hover:border-red-700 dark:hover:text-red-400 text-slate-600 dark:text-gray-300 font-semibold rounded-lg transition-all text-sm"
                        >
                          {t("editor.remove", "Remove")}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-slate-100 dark:bg-[#2e2e2e] rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:bg-[#fff0e6] dark:group-hover:bg-[#f5832a]/10 transition-all duration-200">
                          <Package className="w-8 h-8 text-slate-500 dark:text-gray-400 group-hover:text-[#f5832a]" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">{t("editor.clickToUploadH5P", "Click to upload H5P package")}</h3>
                        <p className="text-sm text-slate-400 dark:text-gray-300/40">{t("editor.h5pFilesOnly", ".h5p files only")}</p>
                      </>
                    )}
                  </div>
                  {pendingH5PFile && (
                    <p className="text-center text-xs text-slate-400 dark:text-gray-300/40 mt-3">
                      {t("editor.h5pImportNote", "The H5P package will be imported when you continue. You still need to select a video source.")}
                    </p>
                  )}
                </>
              )}

              <div className="mt-10 flex justify-end">
                <button
                  type="button"
                  onClick={activeUploadTab === "youtube" && !store.video && youtubeLink.trim() ? handleYoutubeImport : handleContinueToStep2}
                  disabled={
                    isImportingH5P ||
                    isUploading ||
                    (activeUploadTab === "youtube" && !youtubeLink.trim() && !store.video) ||
                    (activeUploadTab === "file" && !store.video) ||
                    (activeUploadTab === "h5p" && !pendingH5PFile && !store.video)
                  }
                  className="flex items-center gap-2 px-7 py-3 bg-[#f5832a] hover:bg-[#e86e15] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-[#f5832a]/20 transition-all duration-200 active:scale-[0.98]"
                >
                  {isImportingH5P || isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t("editor.continue", "Continue")}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Edit ─────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex-1 min-h-0 flex flex-col">

              {/* ── Reusable panels ─────────────────────────────────────────── */}

              {/* Video player node — extracted so it can be placed in either layout */}
              {(() => {
                const videoNode = (
                  <div className="flex flex-col gap-3 min-w-0">
                    <div className="relative bg-slate-900 rounded-t-2xl shadow-sm border border-slate-800 border-b-0 sticky top-0" style={{ aspectRatio: "16/9" }}>
                      <div className="absolute inset-0 rounded-t-2xl overflow-hidden">
                        {videoSrc ? (
                          <video
                            ref={videoRef}
                            src={videoSrc}
                            onClick={flashAndToggle}
                            onTimeUpdate={() => {
                              const ct = videoRef.current?.currentTime || 0;
                              store.setCurrentTime(ct);
                              checkInteractionTrigger(ct);
                            }}
                            onLoadedMetadata={() => {
                              const dur = videoRef.current?.duration || 0;
                              setVideoDuration(dur);
                              videoDurationRef.current = dur;
                            }}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            className="w-full h-full object-contain cursor-pointer"
                          />
                        ) : store.video?.youtubeId ? (
                          <div className="relative w-full h-full">
                            <div ref={ytContainerRef} className="w-full h-full" />
                            <div className="absolute inset-0 cursor-pointer" onClick={flashAndToggle} />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <p>{t("editor.noVideoSource", "No video source")}</p>
                          </div>
                        )}
                      </div>

                      {clickFlash && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                          <div className="bg-black/40 rounded-full p-5 animate-ping-once">
                            {clickFlash === "play"
                              ? <Play className="w-12 h-12 text-white fill-white" />
                              : <Pause className="w-12 h-12 text-white fill-white" />}
                          </div>
                        </div>
                      )}

                      {previewContent && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 rounded-t-2xl">
                          <InteractionPreview
                            content={previewContent}
                            onContinue={() => {
                              setPreviewContent(null);
                              if (videoRef.current) videoRef.current.play().catch(() => {});
                              if (ytPlayerRef.current) ytPlayerRef.current.playVideo();
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <VideoControls
                      currentTime={store.currentTime}
                      duration={videoDuration}
                      isPlaying={isPlaying}
                      sortedContents={sortedContents}
                      onSeek={seekTo}
                      onTogglePlay={togglePlay}
                      onDotClick={(c) => setOpenForContent(c)}
                    />
                  </div>
                );

                const aiNode = (
                  <div className="flex flex-col h-full">
                    <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-white/10 shrink-0">
                      <div className="flex items-center gap-3">
                        {!aiIsRunning && !aiIsDone && (
                          <>
                            <button
                              type="button"
                              onClick={handleTranscribeAndGenerate}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-[#1e3a5f] hover:bg-[#2d5286] dark:bg-transparent dark:border dark:border-[#1e3a5f] dark:hover:border-[#3d6ba6] text-white font-bold rounded-xl transition-colors text-sm shadow-sm"
                            >
                              <Sparkles className="w-4 h-4" />
                              {t("editor.transcribeAndGenerate", "Transcribe & Generate H5P with AI")}
                            </button>
                            {aiUsage && (
                              <div className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg shrink-0">
                                <span className={`text-sm font-bold ${aiUsage.isAdmin ? 'text-slate-700 dark:text-gray-300' : aiUsage.usedToday >= (aiUsage.limit ?? 3) ? 'text-red-500' : 'text-slate-700 dark:text-gray-300'}`}>
                                  {aiUsage.isAdmin ? '∞' : `${aiUsage.usedToday}/${aiUsage.limit}`}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {aiIsRunning && (
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-[#f5832a] shrink-0" />
                              <span className="text-sm text-[#1e3a5f] dark:text-gray-200 font-semibold truncate flex-1">{aiUnifiedMessage}</span>
                              <span className="font-mono text-xs text-slate-500 shrink-0">{aiUnifiedProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-[#1e3a5f] h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${aiUnifiedProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-3">
                        <input ref={transcriptInputRef} type="file" accept=".vtt,.srt" onChange={handleTranscriptUpload} className="hidden" title="Upload transcript file" aria-label="Upload transcript file" />
                        <button
                          type="button"
                          onClick={() => transcriptInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#1e3a5f] font-medium transition-colors"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          {store.transcriptFilename ? `${t("editor.usingTranscript", "Using:")} ${store.transcriptFilename}` : t("editor.orUploadTranscript", "Or upload transcript (.vtt/.srt)")}
                        </button>
                      </div>
                    </div>

                    <div className="overflow-y-auto flex-1 px-3 py-3">
                      {store.topics.length > 0 ? (
                        <TopicsPanel topics={store.topics} segments={store.segments} onSeek={seekTo} />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                          <FileText className="w-10 h-10 mb-3 text-slate-200" />
                          <p className="font-semibold text-sm">
                            {isExtractingTranscript || store.isAnalyzing || store.injectProgress > 0 ? t("editor.processing", "Processing...") : t("editor.noTopicsYet", "No topics yet")}
                          </p>
                          <p className="text-xs mt-1 text-center text-slate-400">
                            {isExtractingTranscript || store.isAnalyzing || store.injectProgress > 0 ? "" : t("editor.noTopicsHint", "Click the button above to transcribe and generate H5P questions automatically.")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );

                const interactionsNode = store.video?.id ? (
                  <div className="flex flex-col h-full">
                    <H5PEditorPanel
                    h5pContents={sortedContents}
                    currentTime={store.currentTime}
                    videoId={store.video.id}
                    openForContent={openForContent}
                    clearOpen={() => setOpenForContent(null)}
                    onFormDirtyChange={setHasUnsavedChanges}
                    onSaved={async () => {
                      await store.loadH5PContents(store.video!.id);
                      notify("Interaction saved!", "success");
                    }}
                    onDeleted={async (id) => {
                      await store.removeH5PContent(id);
                      notify("Interaction deleted", "info");
                    }}
                    onSeek={seekTo}
                  />
                  </div>
                ) : null;

                if (isWideLayout) {
                  // ── 3-column resizable layout (xl+) ─────────────────────────
                    return (
                      <div ref={colContainerRef} className="flex items-stretch w-full flex-1 min-h-0 overflow-hidden">
                      {/* AI column */}
                      <div className="flex flex-col min-w-0 overflow-hidden h-full" style={{ width: `${colWidths[0]}%` }}>
                        {aiNode}
                      </div>

                      {/* Divider 0 */}
                      <div
                        className="w-2 shrink-0 flex items-center justify-center cursor-col-resize group relative z-10"
                        onMouseDown={(e) => startColDrag(0, e)}
                      >
                        <div className="w-0.5 h-full bg-slate-200 dark:bg-white/10 group-hover:bg-[#1e3a5f]/50 dark:group-hover:bg-[#3d6ba6]/60 transition-colors rounded-full" />
                        <div className="absolute top-1/2 -translate-y-1/2 flex flex-col gap-0.5 pointer-events-none">
                          <div className="w-1 h-1 rounded-full bg-slate-400 dark:bg-white/30 group-hover:bg-[#1e3a5f] dark:group-hover:bg-[#3d6ba6] transition-colors" />
                          <div className="w-1 h-1 rounded-full bg-slate-400 dark:bg-white/30 group-hover:bg-[#1e3a5f] dark:group-hover:bg-[#3d6ba6] transition-colors" />
                          <div className="w-1 h-1 rounded-full bg-slate-400 dark:bg-white/30 group-hover:bg-[#1e3a5f] dark:group-hover:bg-[#3d6ba6] transition-colors" />
                        </div>
                      </div>

                      {/* Video column */}
                      <div className="flex flex-col min-w-0 h-full" style={{ width: `${colWidths[1]}%` }}>
                        {videoNode}
                      </div>

                      {/* Divider 1 */}
                      <div
                        className="w-2 shrink-0 flex items-center justify-center cursor-col-resize group relative z-10"
                        onMouseDown={(e) => startColDrag(1, e)}
                      >
                        <div className="w-0.5 h-full bg-slate-200 dark:bg-white/10 group-hover:bg-[#1e3a5f]/50 dark:group-hover:bg-[#3d6ba6]/60 transition-colors rounded-full" />
                        <div className="absolute top-1/2 -translate-y-1/2 flex flex-col gap-0.5 pointer-events-none">
                          <div className="w-1 h-1 rounded-full bg-slate-400 dark:bg-white/30 group-hover:bg-[#1e3a5f] dark:group-hover:bg-[#3d6ba6] transition-colors" />
                          <div className="w-1 h-1 rounded-full bg-slate-400 dark:bg-white/30 group-hover:bg-[#1e3a5f] dark:group-hover:bg-[#3d6ba6] transition-colors" />
                          <div className="w-1 h-1 rounded-full bg-slate-400 dark:bg-white/30 group-hover:bg-[#1e3a5f] dark:group-hover:bg-[#3d6ba6] transition-colors" />
                        </div>
                      </div>

                      {/* Interactions column */}
                      <div className="flex flex-col min-w-0 overflow-hidden h-full" style={{ width: `${colWidths[2]}%` }}>
                        {interactionsNode}
                      </div>
                    </div>
                  );
                }

                // ── Narrow layout: video on top, AI + Interactions below ──────
                return (
                  <div className="flex flex-col gap-5">
                    {videoNode}
                    <div className="grid grid-cols-2 gap-5 items-stretch">
                      <div className="flex flex-col min-h-[400px]">{aiNode}</div>
                      <div className="flex flex-col min-h-[400px]">{interactionsNode}</div>
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
