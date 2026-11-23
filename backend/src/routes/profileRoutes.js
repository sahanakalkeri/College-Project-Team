const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authenticateToken);

// FR10: Get profile
router.get('/', profileController.getProfile);

// FR10: Update profile (including profile picture upload)
router.put('/', upload.single('profilePic'), profileController.updateProfile);

// Change password for all users
router.put('/change-password', profileController.changePassword);

module.exports = router;
