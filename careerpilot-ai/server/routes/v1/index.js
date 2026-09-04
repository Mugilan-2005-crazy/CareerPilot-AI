const express = require('express');
const authRoutes = require('./authRoutes');
const aiRoutes = require('./aiRoutes');

const router = express.Router();

/**
 * API v1 Router
 * 
 * Versioned API namespace at /api/v1/*
 * 
 * Routes:
 * - /api/v1/auth/* - Authentication endpoints
 * - /api/v1/ai/* - AI endpoints (authenticated)
 */

router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
