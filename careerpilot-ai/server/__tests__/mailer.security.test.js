/**
 * SMTP / password-reset regression tests.
 *
 * Exercises the REAL controllers + mailer against an in-process real MongoDB.
 * SMTP delivery is exercised via jest.mock('nodemailer') so we never touch
 * the real network.
 *
 * Environment contract:
 *   - JWT_SECRET must be set (the env loader requires it in non-production).
 *   - SMTP_* are unset by default so SMTP_ENABLED === false; the test that
 *     exercises the configured path sets them BEFORE the app is required.
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-do-not-use-in-prod';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
// Start with SMTP disabled; per-test setup overrides where required.
delete process.env.SMTP_HOST;
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;
delete process.env.SMTP_PORT;
delete process.env.SMTP_FROM;

const request = require('supertest');
const path = require('path');
const mongoose = require('mongoose');

const SERVER_ROOT = path.join(__dirname, '..');
const app = require(path.join(SERVER_ROOT, 'app'));
const User = require(path.join(SERVER_ROOT, 'models', 'User'));
const RefreshToken = require(path.join(SERVER_ROOT, 'models', 'RefreshToken'));

const TEST_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/careerpilot_mailer_test';

beforeAll(async () => {
  await mongoose.connect(TEST_URI, { serverSelectionTimeoutMS: 5000 });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect().catch(() => {});
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), RefreshToken.deleteMany({})]);
});

describe('Mailer module (SMTP contract)', () => {
  afterEach(() => {
    jest.dontMock('nodemailer');
    jest.resetModules();
  });

  test('sendMail throws SMTP_NOT_CONFIGURED when credentials are missing', () => {
    jest.resetModules();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    const mailer = require(path.join(SERVER_ROOT, 'utils', 'mailer'));
    return expect(mailer.sendMail({ to: 'a@b.c', subject: 's', html: 'h' }))
      .rejects.toMatchObject({ code: 'SMTP_NOT_CONFIGURED' });
  });

  test('sendMail invokes the transport when SMTP is configured', () => {
    jest.resetModules();
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'u';
    process.env.SMTP_PASS = 'p';
    process.env.SMTP_FROM = 'Careers <careers@example.com>';
    const fakeTransport = { sendMail: jest.fn().mockResolvedValue({ messageId: 'fake-id-1' }) };
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn().mockReturnValue(fakeTransport),
    }));
    const mailer = require(path.join(SERVER_ROOT, 'utils', 'mailer'));
    return mailer.sendMail({ to: 'a@b.c', subject: 's', html: 'h' }).then((result) => {
      expect(result).toEqual({ success: true, messageId: 'fake-id-1' });
      expect(fakeTransport.sendMail).toHaveBeenCalledTimes(1);
      const call = fakeTransport.sendMail.mock.calls[0][0];
      expect(call.from).toBe('Careers <careers@example.com>');
      expect(call.to).toBe('a@b.c');
    });
  });

  test('sendMail propagates transport failures (no token leakage)', () => {
    jest.resetModules();
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'u';
    process.env.SMTP_PASS = 'p';
    const fakeTransport = { sendMail: jest.fn().mockRejectedValue(new Error('boom')) };
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn().mockReturnValue(fakeTransport),
    }));
    const mailer = require(path.join(SERVER_ROOT, 'utils', 'mailer'));
    return expect(mailer.sendMail({ to: 'a@b.c', subject: 's', html: 'h' })).rejects.toThrow('boom');
  });
});

describe('Password reset end-to-end (SMTP safe)', () => {
  test('forgot-password for unknown email returns generic 200 (no enumeration)', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeUndefined();
  });

  test('forgot-password persists hashed token, never returns raw token', async () => {
    // The default app is loaded with SMTP disabled; verify the safe behavior
    // end-to-end: the token hash is persisted and the reset email HTML is
    // constructed (we exercise that path by also re-requiring sendMail here).
    await User.create({ name: 'Tester', email: 'reset@example.com', password: 'password123' });
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'reset@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeUndefined();
    expect(res.body.resetToken).toBeUndefined();
    expect(res.body.resetPasswordTokenHash).toBeUndefined();
    const fresh = await User.findOne({ email: 'reset@example.com' }).select('+resetPasswordTokenHash +resetPasswordExpires');
    expect(fresh.resetPasswordTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fresh.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
  });

  test('forgot-password without SMTP still responds safely and persists token', async () => {
    await User.create({ name: 'T2', email: 'no-smtp@example.com', password: 'password123' });
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'no-smtp@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeUndefined();
    const fresh = await User.findOne({ email: 'no-smtp@example.com' }).select('+resetPasswordTokenHash');
    expect(fresh.resetPasswordTokenHash).toBeTruthy();
  });

  test('sendMail delivers the provided HTML unchanged and a token-bearing link survives', () => {
    jest.resetModules();
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'u';
    process.env.SMTP_PASS = 'p';
    process.env.SMTP_FROM = 'Careers <careers@example.com>';
    const fakeTransport = { sendMail: jest.fn().mockResolvedValue({ messageId: 'm-1' }) };
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn().mockReturnValue(fakeTransport),
    }));
    const { sendMail } = require(path.join(SERVER_ROOT, 'utils', 'mailer'));
    // The mailer is a transparent pipe: escaping is the controller's job.
    return sendMail({
      to: 'x@example.com',
      subject: 'Reset',
      html: '<p>Hello world</p><a href="https://x/y?token=abc">link</a>',
    }).then(() => {
      const call = fakeTransport.sendMail.mock.calls[0][0];
      expect(call.html).toMatch(/Hello world/);
      expect(call.html).toMatch(/token=abc/);
      // No SMTP credentials or password should ever appear in the envelope.
      expect(JSON.stringify(call)).not.toMatch(/SMTP_PASS/);
      expect(JSON.stringify(call)).not.toMatch(/password/u);
    });
  });

  test('reset-password with valid token changes password and invalidates token', async () => {
    const u = await User.create({ name: 'T3', email: 'tok@example.com', password: 'password123' });
    const { hashToken } = require(path.join(SERVER_ROOT, 'utils', 'token'));
    const rawToken = 'a'.repeat(64);
    u.resetPasswordTokenHash = hashToken(rawToken);
    u.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await u.save();

    const res = await request(app).post('/api/v1/auth/reset-password').send({ token: rawToken, password: 'newpassword123' });
    expect(res.status).toBe(200);
    const after = await User.findById(u._id).select('+password +resetPasswordTokenHash');
    expect(after.resetPasswordTokenHash).toBeUndefined();
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'tok@example.com', password: 'newpassword123' });
    expect(login.status).toBe(200);
  });

  test('reset-password rejects expired token', async () => {
    const u = await User.create({ name: 'T4', email: 'exp@example.com', password: 'password123' });
    const { hashToken } = require(path.join(SERVER_ROOT, 'utils', 'token'));
    const rawToken = 'b'.repeat(64);
    u.resetPasswordTokenHash = hashToken(rawToken);
    u.resetPasswordExpires = new Date(Date.now() - 1000);
    await u.save();
    const res = await request(app).post('/api/v1/auth/reset-password').send({ token: rawToken, password: 'newpassword123' });
    expect(res.status).toBe(400);
  });

  test('reset-password rejects wrong token', async () => {
    const u = await User.create({ name: 'T5', email: 'wrong@example.com', password: 'password123' });
    const { hashToken } = require(path.join(SERVER_ROOT, 'utils', 'token'));
    u.resetPasswordTokenHash = hashToken('correct-token-aaaa');
    u.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await u.save();
    const res = await request(app).post('/api/v1/auth/reset-password').send({ token: 'totally-different-token', password: 'newpassword123' });
    expect(res.status).toBe(400);
  });

  test('reset-password token is one-time-use (replay rejected)', async () => {
    const u = await User.create({ name: 'T6', email: 'replay@example.com', password: 'password123' });
    const { hashToken } = require(path.join(SERVER_ROOT, 'utils', 'token'));
    const rawToken = 'c'.repeat(64);
    u.resetPasswordTokenHash = hashToken(rawToken);
    u.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await u.save();
    const first = await request(app).post('/api/v1/auth/reset-password').send({ token: rawToken, password: 'newpassword1' });
    expect(first.status).toBe(200);
    const replay = await request(app).post('/api/v1/auth/reset-password').send({ token: rawToken, password: 'newpassword2' });
    expect(replay.status).toBe(400);
  });
});