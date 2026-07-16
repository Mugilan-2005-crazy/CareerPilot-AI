const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/environment');
const RefreshToken = require('../models/RefreshToken');
const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');
const { sendMail } = require('../utils/mailer');
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role });
    const accessToken = generateAccessToken(user._id);
    const newRefresh = generateRefreshToken();
    await RefreshToken.create({ user: user._id, token: newRefresh.token, expires: newRefresh.expires });

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

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user._id);
    const newRefresh = generateRefreshToken();
    await RefreshToken.create({ user: user._id, token: newRefresh.token, expires: newRefresh.expires });

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

    await RefreshToken.findOneAndUpdate({ token: refreshToken }, { revoked: new Date() });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored || stored.revoked || stored.expires < Date.now()) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = await User.findById(stored.user);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const accessToken = generateAccessToken(user._id);
    const newRefresh = generateRefreshToken();
    stored.revoked = new Date();
    stored.replacedByToken = newRefresh.token;
    await stored.save();

    await RefreshToken.create(newRefresh);

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
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: 'Reset your CareerPilot AI password',
      html: `<p>Hello ${user.name || 'there'},</p><p>Use the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    });

    res.json({ success: true, message: 'Reset link generated and sent if email is configured' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Token and new password required' });

    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
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
