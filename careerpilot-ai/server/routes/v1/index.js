const express = require('express');
const authRoutes = require('./authRoutes');
const aiRoutes = require('./aiRoutes');
const aiCareerRoutes = require('../aiCareerRoutes');
const skillGraphRoutes = require('../skillGraphRoutes');
const jdIntelligenceRoutes = require('../jdIntelligenceRoutes');
const careerTransitionRoutes = require('../careerTransitionRoutes');

const router = express.Router();

/**
 * API v1 Router
 * 
 * Versioned API namespace at /api/v1/*
 * 
 * Routes:
 * - /api/v1/auth/* - Authentication endpoints
 * - /api/v1/ai/* - AI endpoints (authenticated)
 * - /api/v1/ai-career/* - Career intelligence endpoints (authenticated)
 * - /api/v1/skill-graph/* - Skill graph endpoints (authenticated)
 */

router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use('/ai-career', aiCareerRoutes);
router.use('/skill-graph', skillGraphRoutes);
router.use('/jd-intelligence', jdIntelligenceRoutes);
router.use('/career-transition', careerTransitionRoutes);

module.exports = router;
