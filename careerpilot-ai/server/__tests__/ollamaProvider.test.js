describe('ollamaProvider', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const ENV = { OLLAMA_MODEL: 'test-model', OLLAMA_URL: 'http://127.0.0.1:11434', OLLAMA_TIMEOUT_MS: 20000 };

  function mockEnvironment() {
    jest.doMock(require.resolve('../config/environment'), () => ENV, { virtual: true });
  }

  test('parses JSON response when stream=false (default)', async () => {
    mockEnvironment();
    const postMock = jest.fn().mockResolvedValue({ data: { response: '{"result":"ok"}' } });
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({ post: postMock, get: jest.fn() })),
    }));
    const provider = require('../services/ai/providers/ollamaProvider');
    const resp = await provider.request('resume-analysis', { resume_text: 'x' });
    expect(resp.provider).toBe('ollama');
    expect(resp.structuredData).toEqual({ result: 'ok' });
    expect(postMock).toHaveBeenCalledWith('/api/generate', expect.objectContaining({ stream: false }));
  });

  test('parses JSON response when stream=true with NDJSON chunks', async () => {
    mockEnvironment();
    const chunks = [
      { response: '{"result":' },
      { response: '"ok"}' },
      { response: '', done: true },
    ];
    const postMock = jest.fn().mockResolvedValue({ data: chunks });
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({ post: postMock, get: jest.fn() })),
    }));
    const provider = require('../services/ai/providers/ollamaProvider');
    const resp = await provider.request('resume-analysis', { resume_text: 'x' }, undefined, true);
    expect(resp.provider).toBe('ollama');
    expect(resp.structuredData).toEqual({ result: 'ok' });
    expect(postMock).toHaveBeenCalledWith('/api/generate', expect.objectContaining({ stream: true }));
  });

  test('returns error on empty response', async () => {
    mockEnvironment();
    const postMock = jest.fn().mockResolvedValue({ data: null });
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({ post: postMock, get: jest.fn() })),
    }));
    const provider = require('../services/ai/providers/ollamaProvider');
    const resp = await provider.request('resume-analysis', {});
    expect(resp.success).toBe(false);
    expect(resp.error).toBeDefined();
  });

  test('returns error on invalid structured output', async () => {
    mockEnvironment();
    const postMock = jest.fn().mockResolvedValue({ data: { response: 'not json at all' } });
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({ post: postMock, get: jest.fn() })),
    }));
    const provider = require('../services/ai/providers/ollamaProvider');
    const resp = await provider.request('resume-analysis', { resume_text: 'x' });
    expect(resp.success).toBe(false);
    expect(resp.error).toBe('invalid_or_unstructured_response');
  });

  test('health returns false when no health endpoint', async () => {
    mockEnvironment();
    const getMock = jest.fn().mockRejectedValue(new Error('not found'));
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({ post: jest.fn(), get: getMock })),
    }));
    const provider = require('../services/ai/providers/ollamaProvider');
    const ok = await provider.health();
    expect(ok).toBe(false);
  });

  test('returns OLLAMA_MODEL not configured when model is missing', async () => {
    const noModelEnv = { ...ENV, OLLAMA_MODEL: '' };
    jest.doMock(require.resolve('../config/environment'), () => noModelEnv, { virtual: true });
    const provider = require('../services/ai/providers/ollamaProvider');
    const resp = await provider.request('resume-analysis', { resume_text: 'x' });
    expect(resp.success).toBe(false);
    expect(resp.error).toBe('OLLAMA_MODEL not configured');
  });

  test('handles HTTP 4xx error gracefully', async () => {
    mockEnvironment();
    const postMock = jest.fn().mockRejectedValue(new Error('Request failed with status code 404'));
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({ post: postMock, get: jest.fn() })),
    }));
    const provider = require('../services/ai/providers/ollamaProvider');
    const resp = await provider.request('resume-analysis', { resume_text: 'x' });
    expect(resp.success).toBe(false);
    expect(resp.error).toContain('404');
  });

  test('handles timeout error gracefully', async () => {
    mockEnvironment();
    const postMock = jest.fn().mockRejectedValue(new Error('timeout of 20000ms exceeded'));
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({ post: postMock, get: jest.fn() })),
    }));
    const provider = require('../services/ai/providers/ollamaProvider');
    const resp = await provider.request('resume-analysis', { resume_text: 'x' });
    expect(resp.success).toBe(false);
    expect(resp.error).toContain('timeout');
  });

  test('handles connection reset gracefully', async () => {
    mockEnvironment();
    const postMock = jest.fn().mockRejectedValue(new Error('ECONNRESET'));
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({ post: postMock, get: jest.fn() })),
    }));
    const provider = require('../services/ai/providers/ollamaProvider');
    const resp = await provider.request('resume-analysis', { resume_text: 'x' });
    expect(resp.success).toBe(false);
    expect(resp.error).toContain('ECONNRESET');
  });

  test('extracts JSON from markdown-wrapped response', async () => {
    mockEnvironment();
    const text = '```json\n{"score":95}\n```';
    const postMock = jest.fn().mockResolvedValue({ data: { response: text } });
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({ post: postMock, get: jest.fn() })),
    }));
    const provider = require('../services/ai/providers/ollamaProvider');
    const resp = await provider.request('resume-analysis', { resume_text: 'x' });
    expect(resp.success).toBe(true);
    expect(resp.structuredData).toEqual({ score: 95 });
  });

  test('does not expose secrets in error messages', async () => {
    mockEnvironment();
    const secretError = new Error('connect ECONNREFUSED 127.0.0.1:11434');
    secretError.code = 'ECONNREFUSED';
    const postMock = jest.fn().mockRejectedValue(secretError);
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({ post: postMock, get: jest.fn() })),
    }));
    const provider = require('../services/ai/providers/ollamaProvider');
    const resp = await provider.request('resume-analysis', { resume_text: 'x' });
    expect(resp.error).not.toMatch(/password|secret|key|token|credential/i);
  });

  test('preserves requestId in response', async () => {
    mockEnvironment();
    const postMock = jest.fn().mockResolvedValue({ data: { response: '{"ok":true}' } });
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({ post: postMock, get: jest.fn() })),
    }));
    const provider = require('../services/ai/providers/ollamaProvider');
    const resp = await provider.request('resume-analysis', { resume_text: 'x' }, 'my-request-id');
    expect(resp.requestId).toBe('my-request-id');
  });

  test('generates requestId when not provided', async () => {
    mockEnvironment();
    const postMock = jest.fn().mockResolvedValue({ data: { response: '{"ok":true}' } });
    jest.doMock('axios', () => ({
      create: jest.fn(() => ({ post: postMock, get: jest.fn() })),
    }));
    const provider = require('../services/ai/providers/ollamaProvider');
    const resp = await provider.request('resume-analysis', { resume_text: 'x' });
    expect(resp.requestId).toBeDefined();
    expect(typeof resp.requestId).toBe('string');
  });
});
