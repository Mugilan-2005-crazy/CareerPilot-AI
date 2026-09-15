const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  getMyTwin,
  updateMyTwin,
  exportMyTwin,
  deleteMyTwin,
  getMyTimeline,
  getMyProgress,
  getMyCareerMatch,
} = require('../controllers/careerTwinController');
const { getMyNextBestAction } = require('../services/nextBestAction');

const router = express.Router();

// All career-twin routes are authenticated and strictly owner-scoped.
router.use(authMiddleware);

router.get('/', getMyTwin);
router.put('/', updateMyTwin);
router.get('/export', exportMyTwin);
router.delete('/', deleteMyTwin);
router.get('/next-best-action', getMyNextBestAction);
router.get('/timeline', getMyTimeline);
router.get('/progress', getMyProgress);
router.post('/career-match', getMyCareerMatch);

module.exports = router;
