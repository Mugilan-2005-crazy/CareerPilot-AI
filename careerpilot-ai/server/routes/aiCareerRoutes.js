const express = require('express');
const authMiddleware = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { aiLimiter } = require('../middleware/security');
const aiSchemas = require('../schemas/aiSchemas');
const {
  matchCareers,
  analyzeSkillGapEnhanced,
  analyzeSkillGapAdvanced,
  matchCareerV2,
  generateRoadmap,
  recommendProjects,
  analyzeResumeIntelligence,
  analyzeJdIntelligence,
  exploreCareerPaths,
  getPathDetails,
  runWhatIfSimulation,
  analyzeInterviewIntelligence,
  generateInterviewQuestionsIntelligent,
} = require('../controllers/ai/careerIntelligenceController');

const router = express.Router();

router.use(authMiddleware);
router.use(aiLimiter);

router.post('/career-matching', validateRequest(aiSchemas['career-matching']), matchCareers);
router.post('/career-match-v2', validateRequest(aiSchemas['career-match-v2']), matchCareerV2);
router.post('/skill-gap-enhanced', validateRequest(aiSchemas['skill-gap-enhanced']), analyzeSkillGapEnhanced);
router.post('/skill-gap-advanced', validateRequest(aiSchemas['skill-gap-advanced']), analyzeSkillGapAdvanced);
router.post('/roadmap', validateRequest(aiSchemas['roadmap']), generateRoadmap);
router.post('/project-recommendations', validateRequest(aiSchemas['project-recommendations']), recommendProjects);
router.post('/resume-intelligence', validateRequest(aiSchemas['resume-intelligence']), analyzeResumeIntelligence);
router.post('/jd-intelligence', validateRequest(aiSchemas['jd-intelligence']), analyzeJdIntelligence);
router.post('/career-path-explorer', validateRequest(aiSchemas['career-path-explorer']), exploreCareerPaths);
router.post('/career-path-details', validateRequest(aiSchemas['career-path-details']), getPathDetails);
router.post('/what-if-simulation', validateRequest(aiSchemas['what-if-simulation']), runWhatIfSimulation);
router.post('/interview-intelligence', validateRequest(aiSchemas['interview-intelligence']), analyzeInterviewIntelligence);
router.post('/interview-questions-intelligent', validateRequest(aiSchemas['interview-intelligence']), generateInterviewQuestionsIntelligent);

module.exports = router;
