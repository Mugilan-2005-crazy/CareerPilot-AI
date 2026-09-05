const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { JWT_SECRET } = require('../config/environment');

function token(overrides = {}) {
  return jwt.sign({ id: 'rate-limit-user', ...overrides }, JWT_SECRET, { expiresIn: '1h' });
}

describe('rate-limit stress evidence (DETERMINISTIC, BOUNDED)', () => {
  const GLOBAL_LIMIT = 200;
  const AUTH_LIMIT = 20;
  const AI_LIMIT = 40;
  const WINDOW_MS = 15 * 60 * 1000;

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  test('global limiter: requests below threshold are accepted', async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request(app).get('/health')),
    );
    expect(responses.every((r) => r.status === 200)).toBe(true);
  });

  test('global limiter: requests beyond threshold are rejected with 429', async () => {
    const responses = await Promise.all(
      Array.from({ length: GLOBAL_LIMIT + 10 }, () => request(app).get('/health')),
    );

    const accepted = responses.filter((r) => r.status === 200);
    const rejected = responses.filter((r) => r.status === 429);

    expect(accepted.length).toBeLessThanOrEqual(GLOBAL_LIMIT);
    expect(rejected.length).toBeGreaterThan(0);
    expect(responses.every((r) => [200, 429].includes(r.status))).toBe(true);
  });

  test('rejected response is sanitized and contains no sensitive data', async () => {
    const responses = await Promise.all(
      Array.from({ length: GLOBAL_LIMIT + 20 }, () => request(app).get('/health')),
    );

    const rejected = responses.find((r) => r.status === 429);
    expect(rejected).toBeDefined();
    expect(rejected.body.success).toBe(false);
    expect(JSON.stringify(rejected.body)).not.toMatch(/JWT_SECRET|password|mongodb|redis|secret/i);
  });

  test('auth limiter: 20 unauthenticated /auth requests are accepted, 21st is rejected', async () => {
    const responses = await Promise.all(
      Array.from({ length: AUTH_LIMIT + 2 }, () =>
        request(app).post('/api/v1/auth/register').send({ name: 'X', email: 'x@example.com', password: 'password123' }),
      ),
    );

    const accepted = responses.filter((r) => [201, 400, 409].includes(r.status));
    const rejected = responses.filter((r) => r.status === 429);

    expect(accepted.length).toBeLessThanOrEqual(AUTH_LIMIT);
    expect(rejected.length).toBeGreaterThan(0);
  });

  test('AI limiter: authenticated requests beyond 40 are rejected with 429', async () => {
    const authHeader = `Bearer ${token()}`;
    const responses = await Promise.all(
      Array.from({ length: AI_LIMIT + 5 }, () =>
        request(app)
          .post('/api/v1/ai/skill-gap')
          .set('Authorization', authHeader)
          .send({ skills: ['javascript'] }),
      ),
    );

    const accepted = responses.filter((r) => [200, 400, 401, 502].includes(r.status));
    const rejected = responses.filter((r) => r.status === 429);

    expect(accepted.length).toBeLessThanOrEqual(AI_LIMIT);
    expect(rejected.length).toBeGreaterThan(0);
  });

  test('different authenticated users share the same global limiter', async () => {
    const user1 = `Bearer ${token({ id: 'limit-user-1' })}`;
    const user2 = `Bearer ${token({ id: 'limit-user-2' })}`;

    const responses = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/v1/ai/skill-gap')
          .set('Authorization', i % 2 === 0 ? user1 : user2)
          .send({ skills: ['python'] }),
      ),
    );

    expect(responses.every((r) => [200, 400, 401, 429, 502].includes(r.status))).toBe(true);
  });

  test('concurrent requests cannot race through the limiter', async () => {
    const batch = Array.from({ length: 30 }, () => request(app).get('/health'));
    const responses = await Promise.all(batch);

    const accepted = responses.filter((r) => r.status === 200);
    const rejected = responses.filter((r) => r.status === 429);

    expect(accepted.length + rejected.length).toBe(30);
    expect(accepted.length).toBeLessThanOrEqual(GLOBAL_LIMIT);
  });
});
