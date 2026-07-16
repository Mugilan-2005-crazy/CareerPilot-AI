const express = require('express');
const {
  analyzeResume,
  analyzeSkillGap,
  predictPlacement,
  recommendCompanies,
  generateInterviewQuestions,
} = require('../controllers/ai/aiController');

const router = express.Router();

router.post('/resume-analysis', analyzeResume);
router.post('/skill-gap', analyzeSkillGap);
router.post('/placement-prediction', predictPlacement);
router.post('/company-recommendation', recommendCompanies);
router.post('/interview-questions', generateInterviewQuestions);

module.exports = router;
