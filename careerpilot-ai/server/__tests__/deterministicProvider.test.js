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

  // Regression: a task wired into the routes/controller without a matching
  // entry in the provider endpoint map returns 502 to the client.
  test.each([
    ['resume-intelligence', '/api/ai/resume-intelligence'],
    ['jd-intelligence', '/api/ai/jd-intelligence'],
    ['career-path-explorer', '/api/ai/career-path-explorer'],
    ['career-path-details', '/api/ai/career-path-details'],
    ['what-if-simulation', '/api/ai/what-if-simulation'],
    ['interview-intelligence', '/api/ai/interview-intelligence'],
    ['interview-questions-intelligent', '/api/ai/interview-questions-intelligent'],
    ['career-match-v2', '/api/ai/career-match-v2'],
    ['skill-gap-advanced', '/api/ai/skill-gap-advanced'],
  ])('task %s is routed to %s', async (task, expectedPath) => {
    const postMock = jest.fn().mockResolvedValue({ data: { ok: true } });
    await jest.isolateModules(async () => {
      jest.doMock(require.resolve('axios'), () => ({ create: () => ({ post: postMock, get: jest.fn() }) }), { virtual: true });
      const provider = require('../services/ai/providers/deterministicProvider');
      const resp = await provider.request(task, { any: 'payload' });
      expect(postMock).toHaveBeenCalledWith(expectedPath, { any: 'payload' });
      expect(resp.success).toBe(true);
    });
  });

  test('unknown tasks fail loudly instead of silently returning empty content', async () => {
    await jest.isolateModules(async () => {
      jest.doMock(require.resolve('axios'), () => ({ create: () => ({ post: jest.fn(), get: jest.fn() }) }), { virtual: true });
      const provider = require('../services/ai/providers/deterministicProvider');
      await expect(provider.request('not-a-real-task', {})).rejects.toThrow('Unknown deterministic task');
    });
  });
});
