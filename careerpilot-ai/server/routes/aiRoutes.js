const express = require('express');
const authMiddleware = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { aiLimiter } = require('../middleware/security');
const aiSchemas = require('../schemas/aiSchemas');
const {
  analyzeResume,
  analyzeSkillGap,
  predictPlacement,
  recommendCompanies,
  generateInterviewQuestions,
  aiChat,
  health,
} = require('../controllers/ai/aiController');

const router = express.Router();

// Keep the legacy path compatible while enforcing the same AI security boundary.
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
