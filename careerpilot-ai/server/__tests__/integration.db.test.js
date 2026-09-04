/**
 * LIVE MongoDB integration + security tests.
 *
 * These tests exercise the REAL controllers, middleware, Zod schemas and
 * Mongoose models against a REAL in-process MongoDB (MongoMemoryServer).
 * They are deliberately NOT mocked so that ownership (IDOR), mass assignment,
 * token rotation/replay and shared-content visibility are verified end to end.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const CompanyAptitudeTraining = require('../models/CompanyAptitudeTraining');

// Real MongoDB required. Use TEST_MONGO_URI or a local mongo (e.g. a
// dockerized `mongo:7`); a dedicated database is used so the developer's
// data is never touched. Fail loudly if MongoDB is unreachable.
const TEST_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/careerpilot_test';

beforeAll(async () => {
  try {
    await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    throw new Error(`Integration tests require a reachable MongoDB at ${TEST_URI}\n${err.message}`);
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

describe('authentication lifecycle (REAL MONGODB)', () => {
  test('register -> login -> refresh -> logout -> replay all rejected', async () => {
    const reg = await registerUser('a@example.com');
    expect(reg.token).toBeDefined();
    expect(reg.refreshToken).toBeDefined();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'a@example.com', password: 'password123' });
    expect(login.status).toBe(200);

    // refresh rotates the token
    const refresh1 = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: reg.refreshToken });
    expect(refresh1.status).toBe(200);
    expect(refresh1.body.token).toBeDefined();
    expect(refresh1.body.refreshToken).toBeDefined();

    // Replay of the OLD refresh token must be rejected (rotation).
    const replay = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: reg.refreshToken });
    expect(replay.status).toBe(401);

    // Logout invalidates the newest token.
    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: refresh1.body.refreshToken });
    expect(logout.status).toBe(200);

    const afterLogout = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: refresh1.body.refreshToken });
    expect(afterLogout.status).toBe(401);
  });

  test('wrong password rejected and concurrent refresh yields exactly one success', async () => {
    await registerUser('b@example.com');

    const bad = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'b@example.com', password: 'wrong-password' });
    expect(bad.status).toBe(401);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'b@example.com', password: 'password123' });
    expect(login.status).toBe(200);
    const token = login.body.refreshToken;

    // Fire 5 concurrent refreshes with the same token; exactly one may win.
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app).post('/api/v1/auth/refresh').send({ refreshToken: token }),
      ),
    );
    expect(results.filter((r) => r.status === 200).length).toBe(1);
    expect(results.filter((r) => r.status === 401).length).toBe(4);
  });
});
describe('IDOR / ownership isolation (REAL MONGODB)', () => {
  test("a student cannot read/update/delete another student's resume", async () => {
    const alice = await registerUser('alice@example.com');
    const bob = await registerUser('bob@example.com');

    const created = await request(app)
      .post('/api/resumes')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Alice Resume', filename: 'alice.pdf', contentType: 'application/pdf', sizeBytes: 100 });
    expect(created.status).toBe(201);
    const id = created.body.data._id;

    const bobGet = await request(app).get(`/api/resumes/${id}`).set('Authorization', `Bearer ${bob.token}`);
    expect(bobGet.status).toBe(403);

    const bobPut = await request(app)
      .put(`/api/resumes/${id}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ title: 'hacked' });
    expect(bobPut.status).toBe(403);

    const bobDel = await request(app).delete(`/api/resumes/${id}`).set('Authorization', `Bearer ${bob.token}`);
    expect(bobDel.status).toBe(403);

    const aliceGet = await request(app).get(`/api/resumes/${id}`).set('Authorization', `Bearer ${alice.token}`);
    expect(aliceGet.status).toBe(200);
    expect(aliceGet.body.data.title).toBe('Alice Resume');

    const alicePut = await request(app)
      .put(`/api/resumes/${id}`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Updated' });
    expect(alicePut.status).toBe(200);
    expect(alicePut.body.data.title).toBe('Updated');
  });

  test("query param user IDs cannot widen a student's list scope", async () => {
    const carol = await registerUser('carol@example.com');
    const david = await registerUser('david@example.com');

    await request(app)
      .post('/api/resumes')
      .set('Authorization', `Bearer ${carol.token}`)
      .send({ title: 'Carol', filename: 'c.pdf' });
    await request(app)
      .post('/api/resumes')
      .set('Authorization', `Bearer ${david.token}`)
      .send({ title: 'David', filename: 'd.pdf' });

    const davidList = await request(app).get('/api/resumes').set('Authorization', `Bearer ${david.token}`);
    const davidId = davidList.body.data.find((r) => r.title === 'David').user;

    // Carol asks for David's ID explicitly; ownership must still win.
    const list = await request(app)
      .get(`/api/resumes?user=${davidId}&limit=50`)
      .set('Authorization', `Bearer ${carol.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.every((r) => r.title === 'Carol')).toBe(true);
    expect(list.body.data.some((r) => r.title === 'David')).toBe(false);
  });
});
describe('mass assignment / privilege injection (REAL MONGODB)', () => {
  test('client cannot inject role or owner fields on create', async () => {
    const eve = await registerUser('eve@example.com');

    // role injection blocked
    const roleInjection = await request(app)
      .post('/api/profiles')
      .set('Authorization', `Bearer ${eve.token}`)
      .send({ fullName: 'Eve', role: 'admin' });
    expect(roleInjection.status).toBe(400);

    // owner injection blocked
    const ownerInjection = await request(app)
      .post('/api/profiles')
      .set('Authorization', `Bearer ${eve.token}`)
      .send({ fullName: 'Eve', user: 'someone-else' });
    expect(ownerInjection.status).toBe(400);

    // Valid create still works; ownership is server-derived.
    const ok = await request(app)
      .post('/api/profiles')
      .set('Authorization', `Bearer ${eve.token}`)
      .send({ fullName: 'Eve Watson', headline: 'Software Engineer' });
    expect(ok.status).toBe(201);
    expect(ok.body.data.user.toString()).toBe(eve.user.id);
  });
});

describe('shared content visibility (F2 regression)', () => {
  test('students can list shared CompanyAptitudeTraining', async () => {
    await CompanyAptitudeTraining.collection.insertMany([
      {
        company: 'TCS',
        category: 'Quantitative Aptitude',
        title: 'Basics',
        question: 'What is 2+2?',
        options: ['3', '4'],
        answer: '4',
        explanation: 'Addition',
        difficulty: 'easy',
        isActive: true,
      },
    ]);

    const stu = await registerUser('stu@example.com');
    const list = await request(app)
      .get('/api/company-aptitude-training')
      .set('Authorization', `Bearer ${stu.token}`)
      .query({ company: 'TCS' });
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThanOrEqual(1);
    expect(list.body.data[0].company).toBe('TCS');
  });
});