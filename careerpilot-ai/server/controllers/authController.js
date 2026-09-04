const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/environment');
const RefreshToken = require('../models/RefreshToken');
const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken, hashToken } = require('../utils/token');
const { sendMail } = require('../utils/mailer');

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role: 'student' });
    const accessToken = generateAccessToken(user._id);
    const newRefresh = generateRefreshToken();
    await RefreshToken.create({ user: user._id, tokenHash: hashToken(newRefresh.token), expires: newRefresh.expires });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: accessToken,
      refreshToken: newRefresh.token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id);
    const newRefresh = generateRefreshToken();
    await RefreshToken.create({ user: user._id, tokenHash: hashToken(newRefresh.token), expires: newRefresh.expires });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      refreshToken: newRefresh.token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    await RefreshToken.findOneAndUpdate(
      { $or: [{ tokenHash: hashToken(refreshToken) }, { token: refreshToken }] },
      { $set: { revoked: new Date() }, $unset: { token: 1 } },
    );
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const newRefresh = generateRefreshToken();
    const stored = await RefreshToken.findOneAndUpdate(
      {
        expires: { $gt: new Date() },
        $and: [
          { $or: [{ tokenHash: hashToken(refreshToken) }, { token: refreshToken }] },
          { $or: [{ revoked: { $exists: false } }, { revoked: null }] },
        ],
      },
      { $set: { revoked: new Date(), replacedByTokenHash: hashToken(newRefresh.token) }, $unset: { token: 1 } },
      { new: true },
    );
    if (!stored) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = await User.findById(stored.user);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const accessToken = generateAccessToken(user._id);
    await RefreshToken.create({ user: user._id, tokenHash: hashToken(newRefresh.token), expires: newRefresh.expires });

    res.json({ success: true, token: accessToken, refreshToken: newRefresh.token });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ success: true, message: 'If a user exists, a reset link will be sent' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordTokenHash = hashToken(token);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    try {
      await sendMail({
        to: user.email,
        subject: 'Reset your CareerPilot AI password',
        html: `<p>Hello ${escapeHtml(user.name || 'there')},</p><p>Use the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
      });
    } catch (mailErr) {
      // Never let an SMTP misconfiguration block the legitimate flow or leak
      // account existence. Log a structured, non-sensitive failure marker so
      // operators can correlate, but return the standard generic message.
      // The token is intentionally NOT included in the log line.
      console.warn(JSON.stringify({
        level: 'warn',
        event: 'forgot_password_mail_failed',
        code: mailErr.code || 'SMTP_ERROR',
        requestId: req.requestId,
      }));
    }

    res.json({ success: true, message: 'If a user exists, a reset link will be sent' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Token and new password required' });

    const user = await User.findOne({
      $or: [{ resetPasswordTokenHash: hashToken(token) }, { resetPasswordToken: token }],
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  forgotPassword,
  resetPassword,
};
