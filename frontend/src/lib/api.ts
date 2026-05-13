/**
 * API client for communicating with the Express backend.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  user: { id: string; username: string; email: string; role: string; theme?: string };
}

export interface RegisterResponse {
  message: string;
  pending: true;
  email: string;
}

export async function register(username: string, email: string, password: string): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Registration failed');
  }
  return res.json();
}

export async function verifyEmail(email: string, code: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Verification failed');
  }
  return res.json();
}

export async function login(username: string, password: string, rememberMe = false): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, rememberMe }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Login failed');
  }
  return res.json();
}

export async function saveUserPreferences(theme: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/preferences`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ theme }),
  });
  if (!res.ok) throw new Error('Failed to save preferences');
}

export async function updateMyAccount(username: string, email: string): Promise<LoginResponse['user']> {
  const res = await fetch(`${API_BASE}/auth/account`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ username, email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Failed to update account');
  }
  const data = await res.json();
  return data.user as LoginResponse['user'];
}

export async function changeMyPassword(oldPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/account/password`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Failed to change password');
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Failed to send reset email');
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Failed to reset password');
  }
}

export async function getCurrentUser(): Promise<LoginResponse['user']> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Session invalid');
  return res.json();
}

// ─── Videos ───────────────────────────────────────────────────────────────────

export interface Video {
  id: string;
  title: string;
  description?: string;
  filePath?: string;
  hlsPath?: string;
  thumbnailPath?: string;
  duration?: number;
  status: 'processing' | 'ready' | 'error';
  h5pContent?: Array<{ contentId: string; timestamp: number; type: string }>;
  captions?: unknown;
  youtubeUrl?: string;
  youtubeId?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchVideos(): Promise<Video[]> {
  const res = await fetch(`${API_BASE}/videos`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch videos');
  return res.json();
}

export async function fetchTrashedVideos(): Promise<Video[]> {
  const res = await fetch(`${API_BASE}/videos?trashed=true`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch trashed videos');
  return res.json();
}

export async function trashVideo(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/videos/${id}/trash`, { method: 'PUT', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to trash video');
}

export async function restoreVideo(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/videos/${id}/restore`, { method: 'PUT', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to restore video');
}

export async function fetchVideo(id: string): Promise<Video> {
  const res = await fetch(`${API_BASE}/videos/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Video not found');
  return res.json();
}

export async function updateVideoTitle(id: string, title: string): Promise<Video> {
  const res = await fetch(`${API_BASE}/videos/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update title');
  }
  return res.json();
}

export async function deleteVideo(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/videos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete video');
  }
}

export async function uploadVideo(formData: FormData): Promise<Video> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/videos/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Upload failed');
  }
  const data = await res.json();
  return (data.video || data) as Video;
}

export async function importYoutube(youtubeUrl: string, title?: string): Promise<Video> {
  const res = await fetch(`${API_BASE}/videos/youtube`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ youtubeUrl, title }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'YouTube import failed');
  }
  const data = await res.json();
  return (data.video || data) as Video;
}

// ─── Transcripts ──────────────────────────────────────────────────────────────

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export async function parseTranscript(file: File): Promise<TranscriptSegment[]> {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/transcript/parse`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Transcript parse failed');
  }
  const data = await res.json();
  return data.segments as TranscriptSegment[];
}

export async function extractTranscriptFromVideo(videoId: string): Promise<TranscriptSegment[]> {
  const res = await fetch(`${API_BASE}/transcript/extract/${videoId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Transcript extraction failed');
  }
  const data = await res.json();
  return data.segments as TranscriptSegment[];
}

export async function whisperTranscribeVideo(videoId: string, model = 'base', lang = ''): Promise<TranscriptSegment[]> {
  const params = new URLSearchParams({ model });
  if (lang) params.set('lang', lang);
  const res = await fetch(`${API_BASE}/transcript/whisper/${videoId}?${params}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.hint || 'Whisper transcription failed');
  }
  const data = await res.json();
  return data.segments as TranscriptSegment[];
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────

export type H5PInteractionType = 'MultiChoice' | 'TrueFalse' | 'FillBlanks' | 'DragText' | 'MarkWords' | 'Matching';

export interface AISuggestion {
  id: string;
  timestamp: number;
  type: H5PInteractionType;
  h5pLibrary: string;
  config: Record<string, unknown>;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface TopicQuestion {
  type: 'MultiChoice' | 'TrueFalse' | 'FillBlanks' | 'DragText' | 'MarkWords' | 'Matching';
  question?: string;
  answers?: Array<{ text: string; correct: boolean }>;
  correct?: boolean;
  fillText?: string;
  taskDescription?: string;
  textField?: string;
  pairs?: Array<{ prompt: string; answer: string }>;
  feedback: { correct: string; incorrect: string };
}

export interface TopicNode {
  title: string;
  start: number;
  end: number;
  subtopics?: TopicNode[];
  question?: TopicQuestion;
}

export type SSEPayload =
  | { type: 'progress'; message: string; percent?: number }
  | { type: 'chunk'; text: string; percent?: number }
  | { type: 'result'; topics: TopicNode[] }
  | { type: 'usage'; inputTokens: number; outputTokens: number }
  | { type: 'error'; message: string };

export async function fetchAIUsage(): Promise<{ usedToday: number; limit: number | null; isAdmin: boolean }> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/ai/usage`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}

/**
 * Stream AI analysis via SSE. Returns a cleanup function.
 */
export function streamAnalysis(
  segments: TranscriptSegment[],
  videoId: string,
  onEvent: (event: SSEPayload) => void,
  language = 'en',
): () => void {
  const token = getToken();
  let aborted = false;
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/ai/analyze-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ segments, videoId, language }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        onEvent({ type: 'error', message: err.error || 'Analysis failed' });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (!aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            onEvent(JSON.parse(data) as SSEPayload);
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err: unknown) {
      if (!aborted) {
        onEvent({ type: 'error', message: err instanceof Error ? err.message : 'Streaming failed' });
      }
    }
  })();

  return () => {
    aborted = true;
    controller.abort();
  };
}

// ─── H5P Injection ────────────────────────────────────────────────────────────

export interface InjectResult {
  message: string;
  injected: Array<{ suggestionId: string; contentId: string; timestamp: number; type: string; library: string }>;
  errors: Array<{ suggestionId: string; error: string }>;
  video: { id: string; title: string; h5pContent: unknown[] };
}

export async function injectSuggestions(
  suggestions: AISuggestion[],
  videoId: string,
): Promise<InjectResult> {
  const res = await fetch(`${API_BASE}/ai/inject`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ suggestions, videoId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Injection failed');
  }
  return res.json();
}

// ─── H5P Content ──────────────────────────────────────────────────────────────

export interface H5PContent {
  id: string;
  library: string;
  params: Record<string, unknown>;
  metadata: { title: string; license: string };
  timestamp: number;
  status: string;
}

export async function fetchH5PContent(videoId: string): Promise<H5PContent[]> {
  const res = await fetch(`${API_BASE}/h5p/video/${videoId}/content`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch H5P content');
  return res.json();
}

export async function uploadH5PFile(file: File, videoId?: string, timestamp = 0): Promise<{ content: H5PContent; video: Video }> {
  const token = getToken();
  const form = new FormData();
  form.append('h5pFile', file);
  if (videoId) form.append('videoId', videoId);
  form.append('timestamp', String(timestamp));
  const res = await fetch(`${API_BASE}/h5p/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'H5P import failed');
  }
  const data = await res.json();
  return { content: data.content as H5PContent, video: data.video as Video };
}

export interface H5PContentData {
  library: string;
  params: Record<string, unknown>;
  metadata: { title: string; license: string };
}

export async function createH5PContent(videoId: string, contentData: H5PContentData, timestamp: number): Promise<H5PContent> {
  const res = await fetch(`${API_BASE}/h5p/video/${videoId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ contentData, timestamp }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create H5P content');
  }
  const data = await res.json();
  return (data.content ?? data) as H5PContent;
}

export async function updateH5PContent(contentId: string, contentData: H5PContentData, timestamp: number): Promise<H5PContent> {
  const res = await fetch(`${API_BASE}/h5p/content/${contentId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ contentData, timestamp }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update H5P content');
  }
  const data = await res.json();
  return (data.content ?? data) as H5PContent;
}

export async function deleteH5PContent(contentId: string): Promise<void> {
  await fetch(`${API_BASE}/h5p/content/${contentId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export async function exportH5P(videoId: string): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/h5p/video/${videoId}/export`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  lastLoginDays?: number;
  videoCount?: number;
  videoTrashCount?: number;
  aiProcessedToday?: number;
  aiProcessedEver?: number;
  suspicious?: boolean;
  suspiciousReason?: string;
  recentActivity?: string[];
}

interface AdminUsersResponse {
  users: AdminUser[];
}

export async function fetchAdminUsers(search = ''): Promise<AdminUsersResponse> {
  const params = new URLSearchParams({ limit: '1000', page: '1' });
  if (search) params.set('search', search);
  const res = await fetch(`${API_BASE}/admin/users?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch admin users');
  }
  return res.json();
}

export async function setAdminUserRole(userId: string, role: 'user' | 'admin') {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update user role');
  }
  return res.json() as Promise<{ user: AdminUser }>;
}

export async function toggleAdminUserStatus(userId: string) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update user status');
  }
  return res.json() as Promise<{ user: AdminUser }>;
}

export async function createAdminUser(username: string, email: string, password: string, role: 'user' | 'admin') {
  const res = await fetch(`${API_BASE}/admin/users/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ username, email, password, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create user');
  }
  return res.json() as Promise<{ user: AdminUser }>;
}

export async function deleteAdminUser(userId: string) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete user');
  }
  return res.json() as Promise<{ message: string }>;
}

export async function fetchAdminUser(userId: string) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch user');
  }
  return res.json() as Promise<{ user: AdminUser }>;
}

export async function updateAdminUserAccount(userId: string, username: string, email: string) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/account`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ username, email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update user account');
  }
  return res.json() as Promise<{ user: AdminUser }>;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  description?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export async function fetchAuditLogs(page = 1, limit = 50, action = '') {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), action });
  const res = await fetch(`${API_BASE}/admin/audit-logs?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch audit logs');
  }
  return res.json() as Promise<{ logs: AuditLog[]; pagination: Record<string, unknown> }>;
}

// ─── System Settings ──────────────────────────────────────────────────────────

export interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  category: string;
  description?: string;
  updatedAt: string;
}

export async function fetchSystemSettings() {
  const res = await fetch(`${API_BASE}/admin/system-settings`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch settings');
  }
  return res.json() as Promise<SystemSetting[]>;
}

export async function updateSystemSetting(key: string, value: unknown, category = 'GENERAL', description = '') {
  const res = await fetch(`${API_BASE}/admin/system-settings/${key}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ value, category, description }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update setting');
  }
  return res.json() as Promise<{ message: string; setting: SystemSetting }>;
}

// ─── Login Attempts ───────────────────────────────────────────────────────────

export interface LoginAttempt {
  id: string;
  userId?: string;
  username?: string;
  email?: string;
  ipAddress: string;
  success: boolean;
  failureReason?: string;
  timestamp: string;
}

export async function fetchLoginAttempts(page = 1, limit = 50, email = '', ipAddress = '') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    email,
    ipAddress,
  });
  const res = await fetch(`${API_BASE}/admin/login-attempts?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch login attempts');
  }
  return res.json() as Promise<{ attempts: LoginAttempt[]; pagination: Record<string, unknown> }>;
}

// ─── Content Moderation ───────────────────────────────────────────────────────

export interface ContentFlag {
  id: string;
  contentId: string;
  contentType: string;
  reportedBy?: string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
  action: 'NONE' | 'WARNING' | 'REMOVE' | 'SUSPEND_USER';
  flaggedAt: string;
  reviewedAt?: string;
}

export async function fetchContentFlags(page = 1, limit = 20, status = 'PENDING') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status,
  });
  const res = await fetch(`${API_BASE}/admin/content-flags?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch flags');
  }
  return res.json() as Promise<{ flags: ContentFlag[]; pagination: Record<string, unknown> }>;
}

export async function reviewContentFlag(flagId: string, status: string, action: string, reviewNotes: string) {
  const res = await fetch(`${API_BASE}/admin/content-flags/${flagId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status, action, reviewNotes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to review flag');
  }
  return res.json() as Promise<{ message: string; flag: ContentFlag }>;
}

export async function fetchModerationStats() {
  const res = await fetch(`${API_BASE}/admin/moderation-stats`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch moderation stats');
  }
  return res.json() as Promise<{ pending: number; reviewed: number; approved: number; rejected: number; resolved: number }>;
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export async function fetchAdminDashboard() {
  const res = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch dashboard');
  }
  return res.json() as Promise<Record<string, unknown>>;
}
