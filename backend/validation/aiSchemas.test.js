const {
  analyzeRequestSchema,
  injectRequestSchema,
  formatValidationError
} = require('./aiSchemas');

describe('aiSchemas', () => {
  test('accepts valid analyze request payload', () => {
    const payload = {
      videoId: 'video-123',
      segments: [
        { start: 0, end: 3.2, text: 'Intro sentence' },
        { start: 4, end: 7.5, text: 'Second sentence' }
      ]
    };

    const result = analyzeRequestSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  test('rejects analyze payload with invalid segment shape', () => {
    const payload = {
      videoId: 'video-123',
      segments: [{ start: 5, end: 1, text: '' }]
    };

    const result = analyzeRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);

    if (!result.success) {
      const formatted = formatValidationError(result.error);
      expect(formatted.error).toBe('Validation failed');
      expect(formatted.details.length).toBeGreaterThan(0);
    }
  });

  test('accepts valid inject payload', () => {
    const payload = {
      videoId: 'video-123',
      suggestions: [
        {
          id: 's1',
          timestamp: 35,
          type: 'MultiChoice',
          config: { question: 'Q?', options: ['A', 'B', 'C', 'D'] },
          reason: 'Concept checkpoint',
          status: 'accepted'
        }
      ]
    };

    const result = injectRequestSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  test('rejects inject payload when type is unsupported', () => {
    const payload = {
      videoId: 'video-123',
      suggestions: [
        {
          timestamp: 20,
          type: 'UnknownType',
          config: {},
          reason: 'bad'
        }
      ]
    };

    const result = injectRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
