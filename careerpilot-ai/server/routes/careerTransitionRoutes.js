const express = require('express');
const authMiddleware = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { aiLimiter } = require('../middleware/security');
const aiSchemas = require('../schemas/aiSchemas');
const { analyzeCareerTransition } = require('../controllers/ai/careerTransitionController');

const router = express.Router();

router.use(authMiddleware);
router.use(aiLimiter);

router.post('/career-transition', validateRequest(aiSchemas['career-transition']), analyzeCareerTransition);

module.exports = router;
