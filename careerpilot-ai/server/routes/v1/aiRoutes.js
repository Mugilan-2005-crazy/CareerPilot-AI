const express = require('express');
const authMiddleware = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validateRequest');
const { aiLimiter } = require('../../middleware/security');
const aiSchemas = require('../../schemas/aiSchemas');
const {
  analyzeResume,
  analyzeSkillGap,
  predictPlacement,
  recommendCompanies,
  generateInterviewQuestions,
  aiChat,
  health,
} = require('../../controllers/ai/aiController');

const router = express.Router();

/**
 * Zero-Trust AI Endpoints
 * All routes require authentication (JWT Bearer token)
 * 
 * @route POST /api/v1/ai/resume-analysis
 * @route POST /api/v1/ai/skill-gap
 * @route POST /api/v1/ai/placement-prediction
 * @route POST /api/v1/ai/company-recommendation
 * @route POST /api/v1/ai/interview-questions
 * @route GET /api/v1/ai/health
 * 
 * Authentication: Required
 * Header: Authorization: Bearer <JWT>
 */

// Apply authentication middleware to all AI routes
router.use(authMiddleware);
router.use(aiLimiter);

router.post('/resume-analysis', validateRequest(aiSchemas['resume-analysis']), analyzeResume);
router.post('/skill-gap', validateRequest(aiSchemas['skill-gap']), analyzeSkillGap);
router.post('/placement-prediction', validateRequest(aiSchemas['placement-prediction']), predictPlacement);
router.post('/company-recommendation', validateRequest(aiSchemas['company-recommendation']), recommendCompanies);
router.post('/interview-questions', validateRequest(aiSchemas['interview-questions']), generateInterviewQuestions);
router.post('/ai-chat', validateRequest(aiSchemas['ai-chat']), aiChat);
router.get('/health', health);

module.exports = router;
