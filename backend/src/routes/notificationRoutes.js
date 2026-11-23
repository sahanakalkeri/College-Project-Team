const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// FR9: Get notifications
router.get('/', notificationController.getMyNotifications);

// FR9: Mark as read
router.patch('/:notificationId/read', notificationController.markAsRead);

// FR9: Mark all read
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;
