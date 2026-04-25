const VIDEO_VISIT_KEY = 'reactivedu-video-last-visited';
const LEGACY_VIDEO_VISIT_KEY = 'ai-activedu-video-last-visited';
const VIDEO_VISIT_COUNT_KEY = 'reactivedu-video-visit-count';

function readObject<T extends Record<string, unknown>>(key: string): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {} as T;
    const parsed = JSON.parse(raw) as T;
    return parsed && typeof parsed === 'object' ? parsed : ({} as T);
  } catch {
    return {} as T;
  }
}

export function getVideoVisits(): Record<string, string> {
  const current = readObject<Record<string, string>>(VIDEO_VISIT_KEY);
  if (Object.keys(current).length > 0) return current;

  const legacy = readObject<Record<string, string>>(LEGACY_VIDEO_VISIT_KEY);
  if (Object.keys(legacy).length > 0) {
    localStorage.setItem(VIDEO_VISIT_KEY, JSON.stringify(legacy));
  }
  return legacy;
}

export function getVideoVisitCounts(): Record<string, number> {
  const parsed = readObject<Record<string, number>>(VIDEO_VISIT_COUNT_KEY);
  return Object.fromEntries(
    Object.entries(parsed).map(([videoId, count]) => [videoId, Number.isFinite(count) ? Number(count) : 0]),
  );
}

export function recordVideoVisit(videoId: string): void {
  if (!videoId) return;
  const visits = getVideoVisits();
  const visitCounts = getVideoVisitCounts();
  visits[videoId] = new Date().toISOString();
  visitCounts[videoId] = (visitCounts[videoId] || 0) + 1;
  localStorage.setItem(VIDEO_VISIT_KEY, JSON.stringify(visits));
  localStorage.setItem(VIDEO_VISIT_COUNT_KEY, JSON.stringify(visitCounts));
}
