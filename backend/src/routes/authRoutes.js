const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/authMiddleware');

// FR1: Registration
router.post('/register', authController.register);

// FR2: Login with rate limiting
router.post('/login', loginLimiter, authController.login);

// FR10: Logout
router.post('/logout', authenticateToken, authController.logout);

// Current user details
router.get('/me', authenticateToken, authController.me);

module.exports = router;
