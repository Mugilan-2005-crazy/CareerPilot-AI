describe('ai orchestrator', () => {
  const originalEnv = process.env.AI_PROVIDER;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (originalEnv === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = originalEnv;
  });

  function mockProviderModules(ollamaMock, detMock) {
    const envPath = require.resolve('../config/environment');
    const ollamaPath = require.resolve('../services/ai/providers/ollamaProvider');
    const detPath = require.resolve('../services/ai/providers/deterministicProvider');
    jest.doMock(envPath, () => ({ AI_PROVIDER: 'auto' }), { virtual: true });
    jest.doMock(ollamaPath, () => ollamaMock, { virtual: true });
    jest.doMock(detPath, () => detMock, { virtual: true });
  }

  test('uses ollama when configured and structured response available', async () => {
    const mockOllama = { request: jest.fn().mockResolvedValue({ structuredData: { foo: 'bar' } }) };
    const mockDet = { request: jest.fn() };
    await jest.isolateModules(async () => {
      jest.doMock(require.resolve('../config/environment'), () => ({ AI_PROVIDER: 'ollama' }), { virtual: true });
      jest.doMock(require.resolve('../services/ai/providers/ollamaProvider'), () => mockOllama, { virtual: true });
      jest.doMock(require.resolve('../services/ai/providers/deterministicProvider'), () => mockDet, { virtual: true });
      const orchestrator = require('../services/ai/orchestrator');
      const resp = await orchestrator.handle('resume-analysis', {});
      expect(resp.structuredData).toEqual({ foo: 'bar' });
    });
  });

  test('falls back to deterministic when ollama fails', async () => {
    const mockOllama = { request: jest.fn().mockResolvedValue({ structuredData: null }) };
    const mockDet = { request: jest.fn().mockResolvedValue({ provider: 'deterministic', structuredData: { x: 1 } }) };
    await jest.isolateModules(async () => {
      jest.doMock(require.resolve('../config/environment'), () => ({ AI_PROVIDER: 'auto' }), { virtual: true });
      jest.doMock(require.resolve('../services/ai/providers/ollamaProvider'), () => mockOllama, { virtual: true });
      jest.doMock(require.resolve('../services/ai/providers/deterministicProvider'), () => mockDet, { virtual: true });
      const orchestrator = require('../services/ai/orchestrator');
      const resp = await orchestrator.handle('resume-analysis', {});
      expect(resp.provider).toBe('deterministic');
      expect(resp.structuredData).toEqual({ x: 1 });
    });
  });

  test('invalid AI_PROVIDER returns structured error', async () => {
    await jest.isolateModules(async () => {
      jest.doMock(require.resolve('../config/environment'), () => ({ AI_PROVIDER: 'unknown' }), { virtual: true });
      jest.doMock(require.resolve('../services/ai/providers/ollamaProvider'), () => ({ request: jest.fn() }), { virtual: true });
      jest.doMock(require.resolve('../services/ai/providers/deterministicProvider'), () => ({ request: jest.fn() }), { virtual: true });
      const orchestrator = require('../services/ai/orchestrator');
      const resp = await orchestrator.handle('resume-analysis', {});
      expect(resp.success).toBe(false);
      expect(resp.error).toMatch(/Invalid AI_PROVIDER/);
    });
  });

  test('all providers failed returns structured failure', async () => {
    const mockOllama = { request: jest.fn().mockRejectedValue(new Error('down')) };
    const mockDet = { request: jest.fn().mockRejectedValue(new Error('down')) };
    await jest.isolateModules(async () => {
      jest.doMock(require.resolve('../config/environment'), () => ({ AI_PROVIDER: 'auto' }), { virtual: true });
      jest.doMock(require.resolve('../services/ai/providers/ollamaProvider'), () => mockOllama, { virtual: true });
      jest.doMock(require.resolve('../services/ai/providers/deterministicProvider'), () => mockDet, { virtual: true });
      const orchestrator = require('../services/ai/orchestrator');
      const resp = await orchestrator.handle('resume-analysis', {});
      expect(resp.success).toBe(false);
      expect(resp.error).toMatch(/All AI providers failed/);
    });
  });
});
