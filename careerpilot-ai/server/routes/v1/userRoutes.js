const express = require('express');
const authMiddleware = require('../../middleware/auth');
const { getMe } = require('../../controllers/userController');

const router = express.Router();

router.use(authMiddleware);
router.get('/me', getMe);

module.exports = router;
