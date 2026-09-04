const express = require('express');
const { registerUser, loginUser, logoutUser, refreshToken, forgotPassword, resetPassword } = require('../../controllers/authController');
const { validateRequest } = require('../../middleware/validateRequest');
const { authLimiter } = require('../../middleware/security');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema } = require('../../schemas/authSchemas');

const router = express.Router();

router.use(authLimiter);

/**
 * Authentication Endpoints (API v1)
 * 
 * @route POST /api/v1/auth/register
 * @route POST /api/v1/auth/login
 * @route POST /api/v1/auth/logout
 * @route POST /api/v1/auth/refresh
 * @route POST /api/v1/auth/forgot-password
 * @route POST /api/v1/auth/reset-password
 */

router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/logout', validateRequest(refreshTokenSchema), logoutUser);
router.post('/refresh', validateRequest(refreshTokenSchema), refreshToken);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);

module.exports = router;
