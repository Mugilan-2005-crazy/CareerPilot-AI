jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../models/RefreshToken', () => ({
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
}));

const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { refreshToken } = require('../controllers/authController');

function response() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('refresh token concurrency security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockResolvedValue({ _id: 'user-1' });
    RefreshToken.create.mockResolvedValue({});
  });

  test('only one concurrent request can atomically rotate the same token', async () => {
    RefreshToken.findOneAndUpdate
      .mockResolvedValueOnce({ user: 'user-1' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const results = await Promise.all(
      Array.from({ length: 3 }, () => {
        const res = response();
        return refreshToken({ body: { refreshToken: 'refresh-token' } }, res, jest.fn()).then(() => res);
      }),
    );

    expect(results.filter((res) => res.json.mock.calls[0][0].success).length).toBe(1);
    expect(results.filter((res) => res.status.mock.calls.some(([status]) => status === 401)).length).toBe(2);
    expect(RefreshToken.findOneAndUpdate).toHaveBeenCalledTimes(3);
    expect(RefreshToken.create).toHaveBeenCalledTimes(1);
  });
});