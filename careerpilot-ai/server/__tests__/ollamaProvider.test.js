describe('ollamaProvider', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const ENV = { OLLAMA_MODEL: 'test-model', OLLAMA_URL: 'http://127.0.0.1:11434', OLLAMA_TIMEOUT_MS: 20000 };

  function mockEnvironment() {
    jest.doMock(require.resolve('../config/environment'), () => ENV, { virtual: true });
  }

  test('parses JSON output when present', async () => {
    const output = '{"result":"ok"}';
    const postMock = jest.fn().mockResolvedValue({ data: { output } });
    await jest.isolateModules(async () => {
      mockEnvironment();
      jest.doMock('axios', () => ({
        create: jest.fn(() => ({ post: postMock, get: jest.fn() })),
      }));
      const provider = require('../services/ai/providers/ollamaProvider');
      const resp = await provider.request('resume-analysis', { resume_text: 'x' });
      expect(resp.provider).toBe('ollama');
      expect(resp.structuredData).toEqual({ result: 'ok' });
    });
  });

  test('returns error on empty response', async () => {
    const postMock = jest.fn().mockResolvedValue({ data: null });
    await jest.isolateModules(async () => {
      mockEnvironment();
      jest.doMock('axios', () => ({
        create: jest.fn(() => ({ post: postMock, get: jest.fn() })),
      }));
      const provider = require('../services/ai/providers/ollamaProvider');
      const resp = await provider.request('resume-analysis', {});
      expect(resp.success).toBe(false);
      expect(resp.error).toBeDefined();
    });
  });

  test('health returns false when no health endpoint', async () => {
    const getMock = jest.fn().mockRejectedValue(new Error('not found'));
    await jest.isolateModules(async () => {
      mockEnvironment();
      jest.doMock('axios', () => ({
        create: jest.fn(() => ({ post: jest.fn(), get: getMock })),
      }));
      const provider = require('../services/ai/providers/ollamaProvider');
      const ok = await provider.health();
      expect(ok).toBe(false);
    });
  });
});
