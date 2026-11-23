const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Get standard suggested topics
router.get('/topics/standard', authenticateToken, projectController.getStandardTopics);

// FR6: Select or propose topic
router.post('/topics/select', authenticateToken, authorizeRoles('Student'), projectController.selectOrProposeTopic);

// Submit for faculty review (Team Leader)
router.post('/submit-review', authenticateToken, authorizeRoles('Student'), projectController.submitForReview);

// View project details
router.get('/:projectId', authenticateToken, projectController.getProjectDetails);

// Update project details
router.put('/:projectId', authenticateToken, projectController.updateProjectDetails);

module.exports = router;
