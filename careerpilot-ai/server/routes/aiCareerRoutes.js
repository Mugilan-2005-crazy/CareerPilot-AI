const express = require('express');
const authMiddleware = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { aiLimiter } = require('../middleware/security');
const aiSchemas = require('../schemas/aiSchemas');
const {
  matchCareers,
  analyzeSkillGapEnhanced,
  generateRoadmap,
  recommendProjects,
} = require('../controllers/ai/careerIntelligenceController');

const router = express.Router();

router.use(authMiddleware);
router.use(aiLimiter);

router.post('/career-matching', validateRequest(aiSchemas['career-matching']), matchCareers);
router.post('/skill-gap-enhanced', validateRequest(aiSchemas['skill-gap-enhanced']), analyzeSkillGapEnhanced);
router.post('/roadmap', validateRequest(aiSchemas['roadmap']), generateRoadmap);
router.post('/project-recommendations', validateRequest(aiSchemas['project-recommendations']), recommendProjects);

module.exports = router;
