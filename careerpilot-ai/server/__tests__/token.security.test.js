jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/RefreshToken', () => ({
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock('../utils/mailer', () => ({ sendMail: jest.fn().mockResolvedValue(undefined) }));

const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { hashToken } = require('../utils/token');
const { registerUser, refreshToken, resetPassword } = require('../controllers/authController');

function response() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('token confidentiality and lifecycle security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registration stores a refresh-token hash, not the raw token', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ _id: 'user-1', name: 'Test', email: 'test@example.com', role: 'student' });
    RefreshToken.create.mockResolvedValue({});
    const res = response();

    await registerUser({ body: { name: 'Test', email: 'test@example.com', password: 'password123' } }, res, jest.fn());

    const stored = RefreshToken.create.mock.calls[0][0];
    const rawToken = res.json.mock.calls[0][0].refreshToken;
    expect(stored.tokenHash).toBe(hashToken(rawToken));
    expect(stored.tokenHash).not.toBe(rawToken);
    expect(stored.token).toBeUndefined();
  });

  test('valid raw refresh token is matched by hash and returns a rotated token', async () => {
    const rawToken = 'valid-refresh-token';
    RefreshToken.findOneAndUpdate.mockResolvedValue({ user: 'user-1' });
    User.findById.mockResolvedValue({ _id: 'user-1' });
    RefreshToken.create.mockResolvedValue({});
    const res = response();

    await refreshToken({ body: { refreshToken: rawToken } }, res, jest.fn());

    const filter = RefreshToken.findOneAndUpdate.mock.calls[0][0];
    expect(filter.$and[0].$or).toContainEqual({ tokenHash: hashToken(rawToken) });
    expect(RefreshToken.create.mock.calls[0][0].tokenHash).not.toBe(res.json.mock.calls[0][0].refreshToken);
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });

  test('wrong or replayed refresh tokens are rejected', async () => {
    RefreshToken.findOneAndUpdate.mockResolvedValue(null);
    const res = response();

    await refreshToken({ body: { refreshToken: 'wrong-token' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(RefreshToken.create).not.toHaveBeenCalled();
  });

  test('reset tokens are hashed, expire, and are cleared after one use', async () => {
    const user = { email: 'test@example.com', name: 'Test', save: jest.fn().mockResolvedValue(undefined) };
    User.findOne.mockResolvedValue(user);
    const res = response();

    await resetPassword({ body: { token: 'reset-token', password: 'newpassword123' } }, res, jest.fn());

    const query = User.findOne.mock.calls[0][0];
    expect(query.$or).toContainEqual({ resetPasswordTokenHash: hashToken('reset-token') });
    expect(user.resetPasswordToken).toBeUndefined();
    expect(user.resetPasswordTokenHash).toBeUndefined();
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });

  test('wrong or expired reset tokens are rejected', async () => {
    User.findOne.mockResolvedValue(null);
    const res = response();

    await resetPassword({ body: { token: 'expired-token', password: 'newpassword123' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toBe('Invalid or expired token');
  });
});