const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/environment');

function generateAccessToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function generateRefreshToken() {
  const token = crypto.randomBytes(48).toString('hex');
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return { token, expires };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
};
