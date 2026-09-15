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
