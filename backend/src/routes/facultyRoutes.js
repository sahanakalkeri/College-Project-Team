const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// FR8: Faculty view all teams
router.get('/teams', authenticateToken, authorizeRoles('Faculty', 'Admin'), facultyController.getFacultyTeams);

// FR8: Faculty view project details
router.get('/project/:projectId', authenticateToken, authorizeRoles('Faculty', 'Admin'), facultyController.getProjectDetails);

// FR8: Faculty view task progress
router.get('/project/:projectId/progress', authenticateToken, authorizeRoles('Faculty', 'Admin'), facultyController.getProjectTaskProgress);

// FR8: Faculty provide feedback (rating + comments + approval/needs changes)
router.post('/project/:projectId/feedback', authenticateToken, authorizeRoles('Faculty'), facultyController.submitProjectFeedback);

module.exports = router;
