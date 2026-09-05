const express = require('express');
const authMiddleware = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { aiLimiter } = require('../middleware/security');
const aiSchemas = require('../schemas/aiSchemas');
const { analyzeJobDescription } = require('../controllers/ai/jdIntelligenceController');

const router = express.Router();

router.use(authMiddleware);
router.use(aiLimiter);

router.post('/jd-analysis', validateRequest(aiSchemas['jd-analysis']), analyzeJobDescription);

module.exports = router;
