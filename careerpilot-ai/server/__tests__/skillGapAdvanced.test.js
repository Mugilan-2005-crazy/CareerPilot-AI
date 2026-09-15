/**
 * skill-gap-advanced (v1.1 P0) — endpoint security, validation, and
 * orchestrator passthrough tests. Orchestrator is mocked (same pattern as
 * careerIntelligence.test.js); the deterministic AI logic itself is covered
 * by the Python suite (ai/tests/test_career_intelligence.py).
 */
const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

const User = require('../models/User');
const app = require('../app');
const orchestrator = require('../services/ai/orchestrator');
const { JWT_SECRET } = require('../config/environment');

function token() {
  return jwt.sign({ id: 'sga-test-user' }, JWT_SECRET, { expiresIn: '1h' });
}

function configureActiveUser() {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ id: 'sga-test-user', isActive: true, role: 'student' }),
  });
}

const ADVANCED_CONTENT = {
  target_career: 'Data Scientist',
  known_target: true,
  gaps: [
    {
      skill: 'machine learning',
      required: true,
      required_proficiency: 'advanced',
      current_proficiency: 'none',
      evidence_strength: 'none',
      confidence: 'high',
      gap_severity: 'high',
      gap_size: 3,
      dependency_impact: 1,
      dependency_skills: ['deep learning'],
      priority: 'P0',
      reason: 'test reason',
      improvement_path: ['test step'],
    },
  ],
  buckets: { critical: ['machine learning'], high_impact: [], supporting: [], optional: [] },
  heuristic_readiness_estimate: 12.5,
  readiness_disclaimer: 'Heuristic estimate from stored skill evidence only.',
  source: 'heuristic',
};

describe('skill-gap-advanced endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureActiveUser();
  });

  test('rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/ai-career/skill-gap-advanced')
      .send({ target_career: 'Data Scientist' });
    expect(res.status).toBe(401);
  });

  test('rejects invalid payloads (bad proficiency enum, extra fields)', async () => {
    const responses = await Promise.all([
      request(app)
        .post('/api/ai-career/skill-gap-advanced')
        .set('Authorization', `Bearer ${token()}`)
        .send({ target_career: 'Data Scientist', skill_evidence: [{ skill: 'python', proficiency: 'godlike' }] }),
      request(app)
        .post('/api/ai-career/skill-gap-advanced')
        .set('Authorization', `Bearer ${token()}`)
        .send({ target_career: 'Data Scientist', injected: 'field' }),
    ]);
    responses.forEach((r) => expect(r.status).toBe(400));
  });

  test('returns sanitized explainable gaps on success', async () => {
    const mockHandle = jest.spyOn(orchestrator, 'handle').mockResolvedValue({
      success: true,
      content: { ...ADVANCED_CONTENT },
      structuredData: { ...ADVANCED_CONTENT },
    });

    const res = await request(app)
      .post('/api/ai-career/skill-gap-advanced')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        target_career: 'Data Scientist',
        current_skills: ['python'],
        skill_evidence: [{ skill: 'python', proficiency: 'intermediate', evidence_count: 3 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.known_target).toBe(true);
    expect(res.body.gaps[0].priority).toBe('P0');
    expect(res.body.gaps[0].reason).toBe('test reason');
    // Internal keys must never leak through the controller sanitizer.
    expect(res.body).not.toHaveProperty('provider');
    expect(res.body).not.toHaveProperty('latency');
    mockHandle.mockRestore();
  });

  test('returns 502 when the orchestrator cannot produce output', async () => {
    const mockHandle = jest.spyOn(orchestrator, 'handle').mockResolvedValue({
      success: false,
      provider: null,
      error: 'All AI providers failed',
    });

    const res = await request(app)
      .post('/api/ai-career/skill-gap-advanced')
      .set('Authorization', `Bearer ${token()}`)
      .send({ target_career: 'Data Scientist', current_skills: ['python'] });

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    mockHandle.mockRestore();
  });
});
