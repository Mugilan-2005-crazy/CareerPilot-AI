/**
 * Career Digital Twin (v1.1 P0) — REAL MongoDB integration + security tests.
 *
 * Verified here: authentication, strict ownership, mass-assignment
 * protection, versioning, export portability, deletion, and the
 * Next-Best-Action endpoint's empty/evidence-driven states.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

const TEST_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/careerpilot_test';

beforeAll(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    throw new Error(`Career twin tests require MongoDB at ${TEST_URI}\n${err.message}`);
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect().catch(() => {});
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
});

async function registerUser(email) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Test User', email, password: 'password123' });
  expect(res.status).toBe(201);
  return res.body;
}

const TWIN_PATCH = {
  identity: { fullName: 'Alice', headline: 'Frontend dev', currentLevel: 'fresher' },
  skills: [
    {
      name: 'react',
      proficiency: 'intermediate',
      confidence: 0.8,
      evidence: [{ source: 'user-provided', ref: 'portfolio', weight: 0.7 }],
    },
  ],
  targetRoles: ['Frontend Developer'],
  preferences: { availableHoursPerWeek: 15, preferredLanguage: 'en' },
};

describe('career digital twin (REAL MONGODB)', () => {
  test('unauthenticated access rejected on every route', async () => {
    const routes = [
      ['get', '/api/v1/career-twin'],
      ['put', '/api/v1/career-twin'],
      ['delete', '/api/v1/career-twin'],
      ['get', '/api/v1/career-twin/export'],
      ['get', '/api/v1/career-twin/next-best-action'],
    ];
    for (const [method, path] of routes) {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
    }
  });

  test('GET auto-provisions an empty twin with meaningful empty state', async () => {
    const alice = await registerUser('twin-a@example.com');
    const res = await request(app).get('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.skills).toEqual([]);
    expect(res.body.data.version).toBe(1);
    expect(res.body.data).not.toHaveProperty('__v');
  });

  test('PUT updates the twin, increments version, and rejects invalid payloads', async () => {
    const alice = await registerUser('twin-b@example.com');
    await request(app).get('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`);

    const put = await request(app)
      .put('/api/v1/career-twin')
      .set('Authorization', `Bearer ${alice.token}`)
      .send(TWIN_PATCH);
    expect(put.status).toBe(200);
    expect(put.body.data.version).toBe(2);
    expect(put.body.data.skills[0].name).toBe('react');
    expect(put.body.data.derived.evidenceStrength).toBeGreaterThan(0);

    const bad = await request(app)
      .put('/api/v1/career-twin')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ skills: 'not-an-array' });
    expect(bad.status).toBe(400);
  });

  test('mass assignment: client cannot set version, user, derived, or unknown fields', async () => {
    const alice = await registerUser('twin-c@example.com');
    await request(app).get('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`);

    const injection = await request(app)
      .put('/api/v1/career-twin')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ ...TWIN_PATCH, version: 999, derived: { evidenceStrength: 100 }, user: 'someone-else' });
    expect(injection.status).toBe(400);

    const current = await request(app).get('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`);
    expect(current.body.data.version).not.toBe(999);
    expect(String(current.body.data.user)).toBe(alice.user.id);
  });

  test('ownership isolation: bob can never read or mutate alice twin', async () => {
    const alice = await registerUser('twin-d@example.com');
    const bob = await registerUser('twin-e@example.com');
    await request(app).get('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`);
    await request(app).put('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`).send(TWIN_PATCH);

    const bobGet = await request(app).get('/api/v1/career-twin').set('Authorization', `Bearer ${bob.token}`);
    expect(bobGet.status).toBe(200);
    expect(bobGet.body.data.skills).toEqual([]);
    expect(bobGet.body.data.targetRoles).toEqual([]);

    await request(app).put('/api/v1/career-twin').set('Authorization', `Bearer ${bob.token}`).send({
      targetRoles: ['Bob Role'],
    });

    const aliceGet = await request(app).get('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`);
    expect(aliceGet.body.data.targetRoles).toEqual(['Frontend Developer']);
  });

  test('export returns a portable copy; delete removes the twin', async () => {
    const alice = await registerUser('twin-f@example.com');
    await request(app).get('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`);
    await request(app).put('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`).send(TWIN_PATCH);

    const exp = await request(app).get('/api/v1/career-twin/export').set('Authorization', `Bearer ${alice.token}`);
    expect(exp.status).toBe(200);
    expect(exp.body.data.version).toBe(2);
    expect(exp.body.data.skills[0].name).toBe('react');
    expect(exp.body.data).not.toHaveProperty('user');

    const del = await request(app).delete('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`);
    expect(del.status).toBe(200);

    const afterDelete = await request(app).get('/api/v1/career-twin/export').set('Authorization', `Bearer ${alice.token}`);
    expect(afterDelete.status).toBe(404);
  });
});

describe('career timeline + progress + career match (REAL MONGODB)', () => {
  const orchestrator = require('../services/ai/orchestrator');

  test('timeline records twin transitions; progress returns insufficient evidence until 2 snapshots', async () => {
    const alice = await registerUser('tl-a@example.com');
    await request(app).get('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`);

    const put1 = await request(app)
      .put('/api/v1/career-twin')
      .set('Authorization', `Bearer ${alice.token}`)
      .send(TWIN_PATCH);
    expect(put1.status).toBe(200);
    expect(put1.body.meta.eventsRecorded).toBeGreaterThan(0);

    // Update proficiency AND add a second evidence item on the existing skill.
    const put2 = await request(app)
      .put('/api/v1/career-twin')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({
        skills: [{
          name: 'react',
          proficiency: 'advanced',
          confidence: 0.9,
          evidence: [
            { source: 'user-provided', ref: 'portfolio', weight: 0.7 },
            { source: 'externally-verified', ref: 'assessment:react', weight: 0.9 },
          ],
        }],
      });
    expect(put2.status).toBe(200);

    const tl = await request(app)
      .get('/api/v1/career-twin/timeline?limit=50')
      .set('Authorization', `Bearer ${alice.token}`);
    expect(tl.status).toBe(200);
    const types = tl.body.data.events.map((e) => e.type);
    expect(types).toContain('twin_created');
    expect(types).toContain('skill_added');
    expect(types).toContain('evidence_added');
    expect(types).toContain('proficiency_changed');
    expect(types).toContain('target_role_changed');
    expect(tl.body.data.events.length).toBeLessThanOrEqual(50);

    // progress: two snapshots exist now -> before/after comparison.
    const prog = await request(app)
      .get('/api/v1/career-twin/progress')
      .set('Authorization', `Bearer ${alice.token}`);
    expect(prog.status).toBe(200);
    expect(prog.body.data.status).toBe('ok');
    expect(prog.body.data.change.evidenceStrength).toBeGreaterThan(0);
    expect(prog.body.data.baseline.twinVersion).toBeLessThanOrEqual(prog.body.data.current.twinVersion);
  });

  test('progress returns insufficient_evidence with fewer than two snapshots', async () => {
    const bob = await registerUser('tl-b@example.com');
    const prog = await request(app)
      .get('/api/v1/career-twin/progress')
      .set('Authorization', `Bearer ${bob.token}`);
    expect(prog.status).toBe(200);
    expect(prog.body.data.status).toBe('insufficient_evidence');
  });

  test('timeline is owner-scoped: bob never sees alice events', async () => {
    const alice = await registerUser('tl-c@example.com');
    const bob = await registerUser('tl-d@example.com');
    await request(app).get('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`);
    await request(app).put('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`).send(TWIN_PATCH);

    const bobTl = await request(app)
      .get('/api/v1/career-twin/timeline')
      .set('Authorization', `Bearer ${bob.token}`);
    expect(bobTl.status).toBe(200);
    expect(bobTl.body.data.events.filter((e) => e.type !== 'twin_created')).toHaveLength(0);
  });

  test('career-match: insufficient evidence / no target role / success via orchestrator', async () => {
    const alice = await registerUser('tl-e@example.com');

    // No twin content yet -> INSUFFICIENT_EVIDENCE
    const empty = await request(app)
      .post('/api/v1/career-twin/career-match')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({});
    expect(empty.status).toBe(400);
    expect(empty.body.error.code).toBe('INSUFFICIENT_EVIDENCE');

    // Twin with skills but no target role -> NO_TARGET_ROLE
    await request(app).get('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`);
    await request(app)
      .put('/api/v1/career-twin')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ skills: TWIN_PATCH.skills });
    const noRole = await request(app)
      .post('/api/v1/career-twin/career-match')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({});
    expect(noRole.status).toBe(400);
    expect(noRole.body.error.code).toBe('NO_TARGET_ROLE');

    // With a target role and a mocked orchestrator -> explainable match
    const mockHandle = jest.spyOn(orchestrator, 'handle').mockResolvedValue({
      success: true,
      content: {
        target_career: 'Software Engineer',
        known_target: true,
        overall_alignment: 64.2,
        confidence: 'medium',
        dimensions: [{ name: 'skillMatch', score: 55.6, reason: 'test' }],
        strong_areas: ['python'],
        risk_areas: [],
        missing_requirements: ['javascript'],
        recommended_actions: ['Close the highest-priority gap: javascript.'],
        disclaimer: 'Estimated alignment. Not an employment prediction.',
      },
      structuredData: { overall_alignment: 64.2 },
    });

    const ok = await request(app)
      .post('/api/v1/career-twin/career-match')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ targetRole: 'Software Engineer' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.overall_alignment).toBe(64.2);
    expect(ok.body.data.twinVersion).toBeGreaterThan(1);
    expect(ok.body.data).not.toHaveProperty('provider');
    expect(ok.body.data).not.toHaveProperty('latency');
    mockHandle.mockRestore();
  });
});

describe('next-best-action (REAL MONGODB)', () => {
  test('returns onboarding primary action when no twin exists', async () => {
    const alice = await registerUser('nba-a@example.com');
    const res = await request(app)
      .get('/api/v1/career-twin/next-best-action')
      .set('Authorization', `Bearer ${alice.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.primary.title).toMatch(/Career Twin/i);
    expect(res.body.data.primary.why).toBeTruthy();
  });

  test('returns evidence-driven actions once twin + gap report exist', async () => {
    const alice = await registerUser('nba-b@example.com');
    await request(app).get('/api/v1/career-twin').set('Authorization', `Bearer ${alice.token}`);
    await request(app)
      .put('/api/v1/career-twin')
      .set('Authorization', `Bearer ${alice.token}`)
      .send(TWIN_PATCH);

    await request(app)
      .post('/api/skill-gap-reports')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ role: 'Frontend Developer', missingSkills: ['typescript'], summary: 'gap found' });

    const res = await request(app)
      .get('/api/v1/career-twin/next-best-action')
      .set('Authorization', `Bearer ${alice.token}`);
    expect(res.status).toBe(200);
    const { primary, secondary, optional } = res.body.data;
    expect(primary).toBeTruthy();
    expect(['skill-gap', 'evidence', 'roadmap', 'goal', 'validation']).toContain(primary.kind);
    expect(secondary.length).toBeLessThanOrEqual(2);
    expect(optional.length).toBeLessThanOrEqual(3);
    expect(res.body.data.context.twinVersion).toBe(2);
  });
});
