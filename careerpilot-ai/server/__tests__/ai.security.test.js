const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

const User = require('../models/User');
const orchestrator = require('../services/ai/orchestrator');
const orchestratorHandle = jest.spyOn(orchestrator, 'handle');
const app = require('../app');
const { registerSchema } = require('../schemas/authSchemas');

const JWT_SECRET = require('../config/environment').JWT_SECRET;

function token(overrides = {}) {
  return jwt.sign({ id: 'security-test-user', ...overrides }, JWT_SECRET, { expiresIn: '1h' });
}

function configureActiveUser() {
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ id: 'security-test-user', isActive: true, role: 'student' }),
  });
}

describe('v1 AI security evidence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureActiveUser();
  });

  test.each([
    ['missing token', undefined],
    ['malformed token', 'Bearer not-a-jwt'],
    ['expired token', `Bearer ${jwt.sign({ id: 'security-test-user' }, JWT_SECRET, { expiresIn: -1 })}`],
  ])('%s is rejected before the AI handler', async (_scenario, authorization) => {
    const response = await request(app)
      .post('/api/v1/ai/resume-analysis')
      .set(authorization ? { Authorization: authorization } : {})
      .send({ resume_text: 'valid resume text for testing' });

    expect(response.status).toBe(401);
    expect(orchestratorHandle).not.toHaveBeenCalled();
    expect(response.headers['x-request-id']).toBeDefined();
  });

  test('revoked or inactive users are rejected before the AI handler', async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const response = await request(app)
      .post('/api/v1/ai/resume-analysis')
      .set('Authorization', `Bearer ${token()}`)
      .send({ resume_text: 'test' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('User not found or inactive');
    expect(orchestratorHandle).not.toHaveBeenCalled();
  });

  test('legacy AI routes do not bypass authentication', async () => {
    const response = await request(app).post('/api/ai/resume-analysis').send({});

    expect(response.status).toBe(401);
    expect(orchestratorHandle).not.toHaveBeenCalled();
  });

  test('valid authentication allows the request to reach the AI handler', async () => {
    orchestratorHandle.mockResolvedValue({ content: { result: 'ok' } });

    const response = await request(app)
      .post('/api/v1/ai/resume-analysis')
      .set('Authorization', `Bearer ${token()}`)
      .set('X-Request-ID', 'security-correlation-id')
      .send({ resume_text: 'valid resume text for testing' });

    expect(response.status).toBe(200);
    expect(orchestratorHandle).toHaveBeenCalledWith(
      'resume-analysis',
      { resume_text: 'valid resume text for testing' },
      'security-correlation-id',
    );
    expect(response.headers['x-request-id']).toBe('security-correlation-id');
  });

  test('provider failure returns a safe structured error', async () => {
    orchestratorHandle.mockResolvedValue({ success: false, error: 'provider unavailable' });

    const response = await request(app)
      .post('/api/v1/ai/resume-analysis')
      .set('Authorization', `Bearer ${token()}`)
      .send({ resume_text: 'valid resume text for testing' });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      success: false,
      message: 'AI provider failed to produce valid output',
      requestId: expect.any(String),
    });
    expect(JSON.stringify(response.body)).not.toMatch(/stack|JWT_SECRET|password|mongodb|Bearer/i);
  });

  test.each([
    ['missing required field', {}],
    ['wrong data type', { resume_text: 42 }],
    ['empty input', { resume_text: '' }],
    ['unexpected field', { resume_text: 'valid resume text for testing', extra: 'not allowed' }],
  ])('invalid AI payload: %s', async (_scenario, payload) => {
    const response = await request(app)
      .post('/api/v1/ai/resume-analysis')
      .set('Authorization', `Bearer ${token()}`)
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(orchestratorHandle).not.toHaveBeenCalled();
  });

  test('public registration cannot assign an admin role', () => {
    const parsed = registerSchema.parse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin',
    });

    expect(parsed.role).toBeUndefined();
  });

  test('twenty concurrent unauthenticated requests are all rejected without invoking the handler', async () => {
    const responses = await Promise.all(
      Array.from({ length: 20 }, () => request(app).post('/api/v1/ai/skill-gap').send({})),
    );

    expect(responses.every((response) => response.status === 401)).toBe(true);
    expect(orchestratorHandle).not.toHaveBeenCalled();
  });

  test('malformed JSON is rejected by the HTTP parser', async () => {
    const response = await request(app)
      .post('/api/v1/ai/resume-analysis')
      .set('Content-Type', 'application/json')
      .send('{"resume_text":');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(orchestratorHandle).not.toHaveBeenCalled();
  });

  test('generated request IDs are unique UUIDs', async () => {
    const [first, second] = await Promise.all([
      request(app).post('/api/v1/ai/resume-analysis').send({}),
      request(app).post('/api/v1/ai/resume-analysis').send({}),
    ]);

    expect(first.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/i);
    expect(second.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/i);
    expect(first.headers['x-request-id']).not.toBe(second.headers['x-request-id']);
  });

  test('global rate limiting applies before the v1 AI handler', async () => {
    const responses = await Promise.all(
      Array.from({ length: 210 }, () => request(app).post('/api/v1/ai/skill-gap').send({})),
    );

    expect(responses.some((response) => response.status === 429)).toBe(true);
    expect(responses.every((response) => [401, 429].includes(response.status))).toBe(true);
    expect(orchestratorHandle).not.toHaveBeenCalled();
  });
});