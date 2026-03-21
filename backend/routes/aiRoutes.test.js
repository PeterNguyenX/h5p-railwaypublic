const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  auth: (req, _res, next) => {
    req.user = { id: 'user-1' };
    next();
  }
}));

jest.mock('../services/aiService', () => ({
  analyzeTranscript: jest.fn(),
  analyzeTranscriptStream: jest.fn()
}));

jest.mock('../services/aiInjectionService', () => ({
  injectAll: jest.fn()
}));

const { analyzeTranscript, analyzeTranscriptStream } = require('../services/aiService');
const { injectAll } = require('../services/aiInjectionService');

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai', require('./aiRoutes'));
  return app;
};

describe('aiRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  test('POST /api/ai/analyze returns suggestions for valid payload', async () => {
    analyzeTranscript.mockResolvedValue({
      suggestions: [
        {
          timestamp: 12,
          type: 'MultiChoice',
          config: { question: 'Q?', options: ['A', 'B', 'C', 'D'] },
          reason: 'checkpoint'
        }
      ],
      rawResponse: '[{"timestamp":12}]'
    });

    const app = makeApp();

    const res = await request(app)
      .post('/api/ai/analyze')
      .send({
        videoId: 'video-1',
        segments: [{ start: 0, end: 4, text: 'Intro' }]
      });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.videoId).toBe('video-1');
    expect(res.body.rawResponse).toBe('[{"timestamp":12}]');
    expect(analyzeTranscript).toHaveBeenCalledTimes(1);
  });

  test('POST /api/ai/analyze returns 400 for invalid payload', async () => {
    const app = makeApp();

    const res = await request(app)
      .post('/api/ai/analyze')
      .send({
        videoId: '',
        segments: [{ start: 5, end: 1, text: '' }]
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(analyzeTranscript).not.toHaveBeenCalled();
  });

  test('POST /api/ai/analyze-stream calls stream service for valid payload', async () => {
    analyzeTranscriptStream.mockImplementation(async (_segments, _key, res) => {
      res.status(200).json({ streamed: true });
    });

    const app = makeApp();

    const res = await request(app)
      .post('/api/ai/analyze-stream')
      .send({
        videoId: 'video-1',
        segments: [{ start: 0, end: 3, text: 'A' }]
      });

    expect(res.status).toBe(200);
    expect(res.body.streamed).toBe(true);
    expect(analyzeTranscriptStream).toHaveBeenCalledTimes(1);
  });

  test('POST /api/ai/inject returns injected result', async () => {
    injectAll.mockResolvedValue({
      injected: [{ contentId: 'h5p-1' }],
      errors: [],
      video: { id: 'video-1' }
    });

    const app = makeApp();

    const res = await request(app)
      .post('/api/ai/inject')
      .send({
        videoId: 'video-1',
        suggestions: [
          {
            id: 's1',
            timestamp: 20,
            type: 'MultiChoice',
            config: { question: 'Q?', options: ['A', 'B', 'C', 'D'] },
            reason: 'why',
            status: 'accepted'
          }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.injected).toHaveLength(1);
    expect(injectAll).toHaveBeenCalledWith(expect.any(Array), 'video-1', 'user-1');
  });
});
