const express = require('express');
const { registerUser, loginUser, logoutUser, refreshToken, forgotPassword, resetPassword } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validateRequest');
const { authLimiter } = require('../middleware/security');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema } = require('../schemas/authSchemas');

const router = express.Router();

router.use(authLimiter);

router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/logout', validateRequest(refreshTokenSchema), logoutUser);
router.post('/refresh', validateRequest(refreshTokenSchema), refreshToken);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);

module.exports = router;
