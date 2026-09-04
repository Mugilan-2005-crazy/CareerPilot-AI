describe('deterministicProvider', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('request forwards to AI microservice and returns structured response', async () => {
    const postMock = jest.fn().mockResolvedValue({ data: { ats_score: 80 } });
    const getMock = jest.fn();
    await jest.isolateModules(async () => {
      jest.doMock(require.resolve('axios'), () => ({ create: () => ({ post: postMock, get: getMock }) }), { virtual: true });
      const provider = require('../services/ai/providers/deterministicProvider');
      const resp = await provider.request('resume-analysis', { resume_text: 'test' });
      expect(resp.provider).toBe('deterministic');
      expect(resp.structuredData).toEqual({ ats_score: 80 });
    });
  });

  test('health returns true when microservice responds 200', async () => {
    const getMock = jest.fn().mockResolvedValue({ status: 200 });
    await jest.isolateModules(async () => {
      jest.doMock(require.resolve('axios'), () => ({ create: () => ({ post: jest.fn(), get: getMock }) }), { virtual: true });
      const provider = require('../services/ai/providers/deterministicProvider');
      const ok = await provider.health();
      expect(ok).toBe(true);
    });
  });
});
