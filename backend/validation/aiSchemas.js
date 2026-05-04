const { z } = require('zod');

const transcriptSegmentSchema = z.object({
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  text: z.string().min(1)
}).refine((segment) => segment.end >= segment.start, {
  message: 'segment.end must be greater than or equal to segment.start'
});

const analyzeRequestSchema = z.object({
  segments: z.array(transcriptSegmentSchema).min(1),
  videoId: z.string().min(1)
});

const h5pSuggestionSchema = z.object({
  id: z.string().min(1).optional(),
  timestamp: z.number().nonnegative(),
  type: z.enum(['MultiChoice', 'TrueFalse', 'FillBlanks', 'DragText', 'MarkWords', 'Matching']),
  h5pLibrary: z.string().min(1).optional(),
  config: z.record(z.unknown()),
  reason: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'rejected']).optional()
});

const injectRequestSchema = z.object({
  suggestions: z.array(h5pSuggestionSchema).min(1),
  videoId: z.string().min(1)
});

function formatValidationError(error) {
  const issues = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message
  }));

  return {
    error: 'Validation failed',
    details: issues
  };
}

module.exports = {
  analyzeRequestSchema,
  h5pSuggestionSchema,
  injectRequestSchema,
  formatValidationError
};