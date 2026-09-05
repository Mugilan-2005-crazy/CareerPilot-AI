const express = require('express');
const authMiddleware = require('../middleware/auth');
const { aiLimiter } = require('../middleware/security');
const {
  getSkillPrerequisites,
  getSkillDependents,
  getRelatedSkills,
  getSkillDepth,
  postLearningOrder,
  postSkillCoverage,
  postSuggestNextSkills,
  postSkillGraphSubset,
} = require('../controllers/ai/skillGraphController');

const router = express.Router();

router.use(authMiddleware);
router.use(aiLimiter);

router.get('/prerequisites/:skill', getSkillPrerequisites);
router.get('/dependents/:skill', getSkillDependents);
router.get('/related/:skill', getRelatedSkills);
router.get('/depth/:skill', getSkillDepth);
router.post('/learning-order', postLearningOrder);
router.post('/coverage', postSkillCoverage);
router.post('/suggest-next', postSuggestNextSkills);
router.post('/subset', postSkillGraphSubset);

module.exports = router;
