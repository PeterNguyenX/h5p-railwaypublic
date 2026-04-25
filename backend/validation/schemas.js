/**
 * Centralized Zod validation schemas — REQ-2
 * Used by validate() middleware across all routes.
 */
const { z } = require('zod');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uuidParam = z.string().uuid({ message: 'Invalid ID format' });

/** Strip HTML tags to prevent XSS in string fields */
const safeString = (min = 1, max = 255) =>
  z
    .string()
    .min(min)
    .max(max)
    .transform((s) => s.replace(/<[^>]*>/g, '').trim());

const safeText = () =>
  z
    .string()
    .optional()
    .transform((s) => (s ? s.replace(/<[^>]*>/g, '').trim() : s));

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(128),
});

const registerSchema = z.object({
  username: safeString(3, 30),
  email: z.string().email({ message: 'Invalid email address' }).max(255),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(128),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password: z
    .string()
    .min(6, { message: 'New password must be at least 6 characters' })
    .max(128),
});

// ─── Video Schemas ────────────────────────────────────────────────────────────

const createVideoSchema = z.object({
  title: safeString(1, 100),
  description: safeText(),
  language: z.enum(['en', 'vi']).optional().default('en'),
});

const updateVideoSchema = z.object({
  title: safeString(1, 100).optional(),
  description: safeText(),
  language: z.enum(['en', 'vi']).optional(),
  status: z.enum(['processing', 'ready', 'error']).optional(),
  trimStart: z.number().nonnegative().optional(),
  trimEnd: z.number().nonnegative().optional(),
});

const isYouTubeUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return false;
  const value = raw.trim();
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    return host === 'youtu.be' || host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com');
  } catch {
    return false;
  }
};

const youtubeImportSchema = z.object({
  youtubeUrl: z
    .string()
    .min(1)
    .transform((s) => s.trim())
    .refine(isYouTubeUrl, { message: 'URL must be a YouTube link' }),
  title: safeString(1, 100).optional(),
});

// ─── H5P Schemas ──────────────────────────────────────────────────────────────

const createH5PSchema = z.object({
  videoId: uuidParam,
  timestamp: z.number().nonnegative(),
  library: z.string().min(1).max(100),
  params: z.record(z.unknown()),
  title: safeString(1, 100).optional(),
});

const updateH5PSchema = z.object({
  params: z.record(z.unknown()).optional(),
  timestamp: z.number().nonnegative().optional(),
  title: safeString(1, 100).optional(),
});

// ─── Param Schemas ────────────────────────────────────────────────────────────

const idParamSchema = z.object({
  id: uuidParam,
});

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createVideoSchema,
  updateVideoSchema,
  youtubeImportSchema,
  createH5PSchema,
  updateH5PSchema,
  idParamSchema,
  uuidParam,
  safeString,
  safeText,
};
