import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  AlertCircle,
  Clock,
  Copy,
  Download,
  Folder,
  FolderPlus,
  Loader2,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  VideoOff,
  X,
  Link2,
} from "lucide-react";
import { exportH5P, fetchVideos, trashVideo, restoreVideo as restoreVideoApi, updateVideoTitle, deleteVideo, type Video } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";
import { getVideoVisitCounts, getVideoVisits, recordVideoVisit } from "../../lib/videoVisit";
import { useT } from "../../lib/useT";

type FolderId = string;

interface DashboardFolder {
  id: FolderId;
  name: string;
  createdAt: string;
  trashedAt?: string;
}

interface VideoMeta {
  folderId: FolderId | null;
  trashedAt?: string;
  deletedAt?: string;
  sourceVideoId?: string;
}

interface PersistedState {
  folders: DashboardFolder[];
  byVideoId: Record<string, VideoMeta>;
  virtualVideos: Video[];
}

interface ContextMenuState {
  x: number;
  y: number;
  videoId: string;
}

const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

function relativeTime(iso?: string): string {
  if (!iso) return "never";
  const delta = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(delta) || delta <= 0) return "just now";

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (delta < minute) return "just now";
  if (delta < hour) {
    const n = Math.floor(delta / minute);
    return `${n} minute${n === 1 ? "" : "s"} ago`;
  }
  if (delta < day) {
    const n = Math.floor(delta / hour);
    return `${n} hour${n === 1 ? "" : "s"} ago`;
  }
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  if (delta < week) {
    const n = Math.floor(delta / day);
    return `${n} day${n === 1 ? "" : "s"} ago`;
  }
  if (delta < month) {
    const n = Math.floor(delta / week);
    return `${n} week${n === 1 ? "" : "s"} ago`;
  }
  if (delta < year) {
    const n = Math.floor(delta / month);
    return `${n} month${n === 1 ? "" : "s"} ago`;
  }
  const n = Math.floor(delta / year);
  return `${n} year${n === 1 ? "" : "s"} ago`;
}

function thumbnailUrl(video: Video): string {
  if (video.thumbnailPath) {
    if (video.thumbnailPath.startsWith("http://") || video.thumbnailPath.startsWith("https://")) {
      return video.thumbnailPath;
    }
    if (video.thumbnailPath.startsWith("/api/")) {
      return video.thumbnailPath;
    }
    if (video.thumbnailPath === "/default-thumbnail.svg" || video.thumbnailPath === "default-thumbnail.svg") {
      return "/api/default-thumbnail.svg";
    }
    const normalized = video.thumbnailPath.startsWith("/") ? video.thumbnailPath.slice(1) : video.thumbnailPath;
    const cleanPath = normalized.startsWith("uploads/") ? normalized.slice(8) : normalized;
    return `/api/uploads/${cleanPath}`;
  }
  if (video.youtubeId) return `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  return "";
}

function ThumbWithFallback({ thumb, title }: { thumb: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (!thumb || failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <VideoOff className="w-10 h-10 text-slate-300" />
        <span className="text-xs text-slate-400 px-4 text-center line-clamp-2">{title}</span>
      </div>
    );
  }
  return <img src={thumb} alt={title} className="w-full h-full object-cover" onError={() => setFailed(true)} />;
}

function storageKey(userId?: string): string {
  return `ai-activedu-dashboard-${userId || "guest"}`;
}

function loadState(userId?: string): PersistedState {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { folders: [], byVideoId: {}, virtualVideos: [] };
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      byVideoId: parsed.byVideoId && typeof parsed.byVideoId === "object" ? parsed.byVideoId : {},
      virtualVideos: Array.isArray(parsed.virtualVideos) ? parsed.virtualVideos : [],
    };
  } catch {
    return { folders: [], byVideoId: {}, virtualVideos: [] };
  }
}

function saveState(userId: string | undefined, state: PersistedState): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(state));
}

function trashExpired(trashedAt?: string): boolean {
  if (!trashedAt) return false;
  return Date.now() - new Date(trashedAt).getTime() > TRASH_RETENTION_MS;
}

// t is now provided by useT() inside the component for reactivity

const SUCCESS_NOTICE_KEYS = new Set([
  "dashboard.videoSaved",
  "dashboard.profileSaved",
  "dashboard.videoMovedToFolder",
  "dashboard.videoMovedOutOfFolder",
  "dashboard.movedToTrash",
  "dashboard.videoDuplicated",
  "dashboard.folderMovedToTrash",
  "dashboard.downloadingH5P",
  "dashboard.ltiCopied",
]);

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, user, getCurrentProfile } = useAuthStore();
  const profile = getCurrentProfile();
  const t = useT();

  const [videos, setVideos] = useState<Video[]>([]);
  const [virtualVideos, setVirtualVideos] = useState<Video[]>([]);
  const [folders, setFolders] = useState<DashboardFolder[]>([]);
  const [byVideoId, setByVideoId] = useState<Record<string, VideoMeta>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [menuMoveOpen, setMenuMoveOpen] = useState(false);
  const [detailsVideoId, setDetailsVideoId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("saved") === "1") {
      setNotice("dashboard.videoSaved");
      setSearchParams({}, { replace: true });
    } else if (searchParams.get("profile_saved") === "1") {
      setNotice("dashboard.profileSaved");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [visits, setVisits] = useState<Record<string, string>>({});
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");

  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const run = async (silent = false) => {
      if (!silent) setIsLoading(true);
      setError(null);
      try {
        const apiVideos = await fetchVideos();
        const serverVideos = Array.isArray(apiVideos) ? apiVideos : [];
        setVideos(serverVideos);

        // Sync server trashedAt into byVideoId so other windows see trash changes
        setByVideoId((prev) => {
          const next = { ...prev };
          serverVideos.forEach((v) => {
            const serverTrashedAt = (v as any).trashedAt ?? null;
            next[v.id] = {
              ...(next[v.id] || { folderId: null }),
              trashedAt: serverTrashedAt || undefined,
            };
          });
          return next;
        });

        if (!silent) {
          const persisted = loadState(user?.id);
          const validFolders = persisted.folders.filter((f) => !trashExpired(f.trashedAt));
          const validVideoIds = new Set([...serverVideos, ...persisted.virtualVideos].map((v) => v.id));
          const validMeta = Object.fromEntries(
            Object.entries(persisted.byVideoId).filter(([id, meta]) => validVideoIds.has(id) && !trashExpired(meta.trashedAt)),
          );
          const validVirtualVideos = persisted.virtualVideos.filter((v) => !validMeta[v.id]?.deletedAt);

          setFolders(validFolders);
          setByVideoId(validMeta);
          setVirtualVideos(validVirtualVideos);
          setVisits(getVideoVisits());
          setVisitCounts(getVideoVisitCounts());

          saveState(user?.id, { folders: validFolders, byVideoId: validMeta, virtualVideos: validVirtualVideos });
          initialLoadDone.current = true;
        }
      } catch (err: unknown) {
        if (!silent) setError(err instanceof Error ? err.message : "Failed to load videos");
      } finally {
        if (!silent) setIsLoading(false);
      }
    };

    run();

    // Instant sync between tabs/windows in the same browser
    const channel = new BroadcastChannel('dashboard-sync');
    channel.onmessage = () => run(true);

    // Logo button click in same tab
    const onLogoRefresh = () => run(true);
    window.addEventListener('dashboard-refresh', onLogoRefresh);

    // Sync when returning to this tab (covers cross-device / other browsers)
    const onVisible = () => { if (document.visibilityState === 'visible') run(true); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      channel.close();
      window.removeEventListener('dashboard-refresh', onLogoRefresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [token, navigate, user?.id]);

  useEffect(() => {
    if (!user?.id || !initialLoadDone.current) return;
    saveState(user.id, { folders, byVideoId, virtualVideos });
  }, [folders, byVideoId, virtualVideos, user?.id]);

  useEffect(() => {
    const closeMenu = () => {
      setContextMenu(null);
      setMenuMoveOpen(false);
    };
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(t);
  }, [notice]);

  const allVideos = useMemo(() => [...videos, ...virtualVideos], [videos, virtualVideos]);
  const activeFolders = useMemo(() => folders.filter((f) => !f.trashedAt), [folders]);
  const trashedFolders = useMemo(() => folders.filter((f) => !!f.trashedAt), [folders]);

  const visibleVideos = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = allVideos.filter((video) => {
      const meta = byVideoId[video.id] || { folderId: null };
      if (meta.deletedAt) return false;

      const matchName = !q || video.title.toLowerCase().includes(q);
      const inTrash = !!meta.trashedAt;

      if (selectedFolder === "trash") return inTrash && matchName;
      if (inTrash) return false;
      if (selectedFolder !== "all") return meta.folderId === selectedFolder && matchName;
      return matchName;
    });

    return filtered.sort((a, b) => {
      const av = visits[a.id] ? new Date(visits[a.id]).getTime() : 0;
      const bv = visits[b.id] ? new Date(visits[b.id]).getTime() : 0;
      if (av !== bv) return bv - av;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [allVideos, byVideoId, selectedFolder, search, visits]);

  const activeVideoCount = useMemo(() => {
    return allVideos.filter(v => {
      const meta = byVideoId[v.id] || { folderId: null };
      return !meta.deletedAt && !meta.trashedAt;
    }).length;
  }, [allVideos, byVideoId]);

  const tabVideoCount = useMemo(() => {
    if (selectedFolder === "trash") {
      return allVideos.filter(v => {
        const meta = byVideoId[v.id] || { folderId: null };
        return !meta.deletedAt && !!meta.trashedAt;
      }).length;
    }
    return activeVideoCount;
  }, [allVideos, byVideoId, selectedFolder, activeVideoCount]);

  const detailsVideo = useMemo(() => allVideos.find((v) => v.id === detailsVideoId) || null, [allVideos, detailsVideoId]);

  const touchVisit = (videoId: string) => {
    recordVideoVisit(videoId);
    setVisits(getVideoVisits());
    setVisitCounts(getVideoVisitCounts());
  };

  const openVideo = (videoId: string) => {
    const sourceVideoId = byVideoId[videoId]?.sourceVideoId || videoId;
    touchVisit(videoId);
    navigate(`/app/editor/${sourceVideoId}`);
  };

  const createFolder = () => {
    const name = window.prompt(t("dashboard.folderNamePrompt", "Folder name"));
    if (!name || !name.trim()) return;
    setFolders((prev) => [
      ...prev,
      {
        id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const moveVideoToFolder = (videoId: string, folderId: string | null) => {
    setByVideoId((prev) => ({
      ...prev,
      [videoId]: {
        ...(prev[videoId] || { folderId: null }),
        folderId,
        trashedAt: undefined,
      },
    }));
    setNotice(folderId ? "dashboard.videoMovedToFolder" : "dashboard.videoMovedOutOfFolder");
  };

  const broadcast = () => new BroadcastChannel('dashboard-sync').postMessage('refresh');

  const moveVideoToTrash = async (videoId: string) => {
    try {
      await trashVideo(videoId);
      setByVideoId((prev) => ({
        ...prev,
        [videoId]: { ...(prev[videoId] || { folderId: null }), trashedAt: new Date().toISOString() },
      }));
      setNotice("dashboard.movedToTrash");
      broadcast();
    } catch {
      setNotice("dashboard.failedMoveToTrash");
    }
  };

  const duplicateVideo = (videoId: string) => {
    const original = allVideos.find((v) => v.id === videoId);
    if (!original) return;

    const newId = `dup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const duplicate: Video = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setVirtualVideos((prev) => [...prev, duplicate]);
    setByVideoId((prev) => ({
      ...prev,
      [newId]: {
        folderId: prev[videoId]?.folderId || null,
        sourceVideoId: prev[videoId]?.sourceVideoId || videoId,
      },
    }));
    setNotice("dashboard.videoDuplicated");
  };

  const moveFolderToTrash = (folderId: FolderId) => {
    const now = new Date().toISOString();
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, trashedAt: now } : f)));
    setByVideoId((prev) => {
      const next = { ...prev };
      Object.entries(next).forEach(([videoId, meta]) => {
        if (meta.folderId === folderId) {
          next[videoId] = { ...meta, trashedAt: now };
        }
      });
      return next;
    });
    setSelectedFolder("trash");
    setNotice("dashboard.folderMovedToTrash");
  };

  const restoreVideo = async (videoId: string) => {
    try {
      await restoreVideoApi(videoId);
      setByVideoId((prev) => ({
        ...prev,
        [videoId]: { ...(prev[videoId] || { folderId: null }), trashedAt: undefined, deletedAt: undefined },
      }));
      broadcast();
    } catch {
      setNotice("dashboard.failedRestoreVideo");
    }
  };

  const deleteVideoPermanently = async (videoId: string) => {
    try {
      await deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      setByVideoId((prev) => ({
        ...prev,
        [videoId]: { ...(prev[videoId] || { folderId: null }), deletedAt: new Date().toISOString() },
      }));
      setNotice("dashboard.videoDeletedPermanently");
      broadcast();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "dashboard.failedDeleteVideo");
    }
  };

  const restoreFolder = (folderId: FolderId) => {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, trashedAt: undefined } : f)));
    setByVideoId((prev) => {
      const next = { ...prev };
      Object.entries(next).forEach(([videoId, meta]) => {
        if (meta.folderId === folderId) {
          next[videoId] = { ...meta, trashedAt: undefined };
        }
      });
      return next;
    });
  };

  const deleteFolderPermanently = (folderId: FolderId) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setByVideoId((prev) => {
      const next = { ...prev };
      Object.entries(next).forEach(([videoId, meta]) => {
        if (meta.folderId === folderId) {
          next[videoId] = { ...meta, deletedAt: new Date().toISOString() };
        }
      });
      return next;
    });
  };

  const downloadH5P = async (videoId: string) => {
    try {
      const blob = await exportH5P(videoId);
      const video = allVideos.find((v) => v.id === videoId);
      const name = video?.title?.replace(/[^a-z0-9]/gi, "-") || "video";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${name}.h5p`;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice("dashboard.downloadingH5P");
    } catch {
      setNotice("dashboard.couldNotDownload");
    }
  };

  const copyLtiLink = async (videoId: string) => {
    const lti = `${window.location.origin}/lti/video/${videoId}`;
    try {
      await navigator.clipboard.writeText(lti);
      setNotice("dashboard.ltiCopied");
    } catch {
      setNotice("dashboard.unableToCopyLti");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("dashboard.videosTitle", "Videos")}</h1>
          <p className="text-slate-600 text-[15px]">
            {t("dashboard.welcomeBack", "Welcome back,")} <span className="font-semibold">{profile?.displayName || user?.username || t("dashboard.teacher", "Teacher")}</span>. {t("dashboard.youHave", "You have")} {tabVideoCount} {t("dashboard.videoCount", tabVideoCount === 1 ? "video" : "videos")}{selectedFolder === "trash" ? ` ${t("dashboard.inTrash", "in Trash")}` : ""}.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full max-w-3xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#2e2e2e] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f5832a]/40 focus:border-[#f5832a] transition-all"
              placeholder={t("dashboard.searchPlaceholder", "Search videos by name")}
            />
          </div>
          <Link
            to="/app/editor"
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#f5832a] hover:bg-[#e86e15] dark:bg-transparent dark:border dark:border-[#f5832a] dark:hover:border-[#ffa05c] text-white font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            {t("dashboard.createNewVideo", "Create New Video")}
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedFolder("all")}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${selectedFolder === "all" ? "bg-[#1e3a5f] border-[#1e3a5f] text-white dark:bg-transparent dark:border-[#1e3a5f] dark:text-gray-200" : "bg-white dark:bg-transparent border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5"}`}
        >
          {t("dashboard.all", "All")}
        </button>

        {activeFolders.map((folder) => (
          <div key={folder.id} className="inline-flex items-center">
            <button
              onClick={() => setSelectedFolder(folder.id)}
              className={`px-3 py-2 rounded-l-lg border-y border-l text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${selectedFolder === folder.id ? "bg-[#1e3a5f] border-[#1e3a5f] text-white dark:bg-transparent dark:border-[#1e3a5f] dark:text-gray-200" : "bg-white dark:bg-transparent border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5"}`}
            >
              <Folder className="w-4 h-4" />
              {folder.name}
            </button>
            <button
              onClick={() => moveFolderToTrash(folder.id)}
              title={t("dashboard.moveFolderToTrash", "Move folder to Trash")}
              className="px-2 py-2 rounded-r-lg border text-slate-500 dark:text-gray-400 hover:text-[#f5832a] border-slate-200 dark:border-white/10 bg-white dark:bg-transparent transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          onClick={() => setSelectedFolder("trash")}
          className={`px-3 py-2 rounded-lg border text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${selectedFolder === "trash" ? "bg-[#f5832a] border-[#f5832a] text-white dark:bg-transparent dark:border-[#f5832a] dark:text-gray-200" : "bg-white dark:bg-transparent border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5"}`}
        >
          <Trash2 className="w-4 h-4" />
          {t("dashboard.trash", "Trash")}
        </button>

      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>{t("dashboard.loadingVideos", "Loading your videos...")}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-cards">
          {visibleVideos.map((video) => {
            const thumb = thumbnailUrl(video);
            return (
              <div
                key={video.id}
                className="bg-white dark:bg-[#242424] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                onClick={() => selectedFolder !== "trash" && openVideo(video.id)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setContextMenu({ x: event.clientX, y: event.clientY, videoId: video.id });
                  setMenuMoveOpen(false);
                }}
              >
                <div className="relative aspect-video bg-slate-100">
                  <ThumbWithFallback thumb={thumb} title={video.title} />
                  {selectedFolder !== "trash" && (
                    <div className="absolute inset-0 bg-slate-900/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                        <Play className="w-5 h-5 fill-slate-800 text-slate-800 ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-1.5 mb-1 group/title">
                    {editingTitleId === video.id ? (
                      <input
                        autoFocus
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={async (e) => {
                          e.stopPropagation();
                          if (titleDraft.trim() && titleDraft.trim() !== video.title) {
                            try {
                              const updated = await updateVideoTitle(video.id, titleDraft.trim());
                              setVideos((prev) => prev.map((v) => v.id === video.id ? updated : v));
                            } catch (err) {
                              setNotice(err instanceof Error ? err.message : "Failed to rename");
                            }
                          }
                          setEditingTitleId(null);
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") e.currentTarget.blur();
                          if (e.key === "Escape") setEditingTitleId(null);
                        }}
                        className="flex-1 font-bold text-[17px] text-slate-900 dark:text-white border-b-2 border-[#f5832a] bg-transparent outline-none min-w-0"
                      />
                    ) : (
                      <>
                        <h3 className={`font-bold text-slate-900 dark:text-white leading-tight flex-1 ${video.title.length > 60 ? 'text-[11px]' : video.title.length > 40 ? 'text-[13px]' : video.title.length > 25 ? 'text-[15px]' : 'text-[17px]'}`}>{video.title}</h3>
                        {selectedFolder !== "trash" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setTitleDraft(video.title); setEditingTitleId(video.id); }}
                            className="shrink-0 p-1 text-slate-300 hover:text-slate-600 opacity-0 group-hover/title:opacity-100 transition-opacity"
                            title="Rename"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {selectedFolder !== "trash" && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 shrink-0" />
                      {relativeTime(visits[video.id] ?? video.updatedAt)}
                    </p>
                  )}

                  {selectedFolder === "trash" && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); restoreVideo(video.id); }}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-[#1e3a5f]/40 dark:border-[#1e3a5f] text-[#1e3a5f] dark:text-gray-300 hover:bg-[#1e3a5f]/10 dark:hover:bg-transparent dark:hover:border-[#3d6ba6] inline-flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> {t("dashboard.restore", "Restore")}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteVideoPermanently(video.id); }}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-[#f5832a]/40 text-[#f5832a] hover:bg-[#f5832a]/10 dark:border-[#f5832a] dark:hover:bg-transparent dark:hover:border-[#ffa05c] inline-flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {t("dashboard.deletePermanently", "Delete Permanently")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedFolder === "trash" && trashedFolders.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-200">{t("dashboard.foldersInTrash", "Folders in Trash")}</h2>
          {trashedFolders.map((folder) => {
            const folderVideos = allVideos.filter(
              (video) => byVideoId[video.id]?.folderId === folder.id && !!byVideoId[video.id]?.trashedAt && !byVideoId[video.id]?.deletedAt,
            );
            return (
              <div key={folder.id} className="bg-white dark:bg-[#242424] border border-slate-200 dark:border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-slate-800 font-semibold">
                    <Folder className="w-4 h-4" /> {folder.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restoreFolder(folder.id)}
                      className="text-xs px-2.5 py-1.5 rounded-md border border-[#1e3a5f]/40 dark:border-[#1e3a5f] text-[#1e3a5f] dark:text-gray-300 hover:bg-[#1e3a5f]/10 dark:hover:bg-transparent dark:hover:border-[#3d6ba6] transition-colors"
                    >
                      {t("dashboard.restoreFolder", "Restore Folder")}
                    </button>
                    <button
                      onClick={() => deleteFolderPermanently(folder.id)}
                      className="text-xs px-2.5 py-1.5 rounded-md border border-[#f5832a]/40 text-[#f5832a] hover:bg-[#f5832a]/10 dark:border-[#f5832a] dark:hover:bg-transparent dark:hover:border-[#ffa05c] transition-colors"
                    >
                      {t("dashboard.deletePermanently", "Delete Permanently")}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {folderVideos.length} {t("dashboard.videoCount", folderVideos.length === 1 ? "video" : "videos")} {t("dashboard.inThisFolder", "in this folder.")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !error && visibleVideos.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <p className="font-medium">{t("dashboard.noVideosFound", "No videos found.")}</p>
        </div>
      )}

      {detailsVideo && (
        <aside className="fixed right-0 top-0 h-screen w-full max-w-md bg-white dark:bg-[#242424] border-l border-slate-200 dark:border-white/10 shadow-xl z-50 overflow-y-auto">
          <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("dashboard.details", "Details")}</h3>
            <button
              onClick={() => setDetailsVideoId(null)}
              title={t("dashboard.closeDetails", "Close details")}
              aria-label={t("dashboard.closeDetails", "Close details")}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
              {thumbnailUrl(detailsVideo) ? (
                <img src={thumbnailUrl(detailsVideo)} alt={detailsVideo.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <VideoOff className="w-8 h-8" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500">{t("dashboard.name", "Name")}</p>
              <p className="text-sm font-semibold text-slate-900">{detailsVideo.title}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t("dashboard.numberOfVisitors", "Number of visitors")}</p>
              <p className="text-sm font-semibold text-slate-900">{visitCounts[detailsVideo.id] || 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t("dashboard.folder", "Folder")}</p>
              <p className="text-sm font-semibold text-slate-900">{folders.find((f) => f.id === byVideoId[detailsVideo.id]?.folderId)?.name || t("dashboard.notInFolder", "Not in folder")}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t("dashboard.owner", "Owner")}</p>
              <p className="text-sm font-semibold text-slate-900">{profile?.displayName || user?.username || t("dashboard.unknown", "Unknown")}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t("dashboard.lastModifiedDate", "Last modified date")}</p>
              <p className="text-sm font-semibold text-slate-900">{new Date(detailsVideo.updatedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t("dashboard.createdDate", "Created date")}</p>
              <p className="text-sm font-semibold text-slate-900">{new Date(detailsVideo.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </aside>
      )}

      {contextMenu && (
        <div
          className="fixed z-[60] w-64 bg-white dark:bg-[#2e2e2e] border border-slate-200 dark:border-white/10 shadow-xl rounded-lg p-1"
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 380),
            left: Math.min(contextMenu.x, window.innerWidth - 270),
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => {
              openVideo(contextMenu.videoId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 text-sm text-slate-700 dark:text-gray-300 flex items-center gap-2 font-medium transition-colors"
          >
            <Play className="w-4 h-4" /> {t("dashboard.open", "Open")}
          </button>

          <button
            onClick={() => {
              const v = allVideos.find((v) => v.id === contextMenu.videoId);
              if (v) { setTitleDraft(v.title); setEditingTitleId(v.id); }
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 text-sm text-slate-700 dark:text-gray-300 flex items-center gap-2 transition-colors"
          >
            <Pencil className="w-4 h-4" /> {t("dashboard.rename", "Rename")}
          </button>

          <button
            onClick={() => {
              duplicateVideo(contextMenu.videoId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 text-sm text-slate-700 dark:text-gray-300 flex items-center gap-2 transition-colors"
          >
            <Copy className="w-4 h-4" /> {t("dashboard.duplicate", "Duplicate")}
          </button>


          <button
            onClick={() => {
              downloadH5P(contextMenu.videoId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 text-sm text-slate-700 dark:text-gray-300 flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" /> {t("dashboard.download", "Download")}
          </button>

          <button
            onClick={() => {
              copyLtiLink(contextMenu.videoId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-white/5 text-sm text-slate-700 dark:text-gray-300 flex items-center gap-2 transition-colors"
          >
            <Link2 className="w-4 h-4" /> {t("dashboard.ltiLink", "LTI link")}
          </button>

          <button
            onClick={() => {
              moveVideoToTrash(contextMenu.videoId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-[#f5832a]/10 dark:hover:bg-[#f5832a]/10 text-sm text-[#f5832a] flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> {t("dashboard.moveToTrash", "Move to Trash")}
          </button>
        </div>
      )}

      {notice && (
        <div className={`fixed bottom-5 right-5 px-4 py-2.5 rounded-lg shadow-lg text-white text-sm z-[70] inline-flex items-center gap-2 ${notice && SUCCESS_NOTICE_KEYS.has(notice) ? "bg-[#1e3a5f] dark:border dark:border-[#1e3a5f] dark:bg-transparent" : "bg-[#333333] dark:border dark:border-white/20 dark:bg-transparent"}`}>
          <AlertCircle className="w-4 h-4" />
          {notice ? t(notice, notice) : null}
        </div>
      )}
    </div>
  );
}
