const User = require('../models/User');

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -resetPasswordToken -resetPasswordTokenHash -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMe };
