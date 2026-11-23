const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// FR7: Assign task (Team Leader or Faculty)
router.post('/assign', authenticateToken, authorizeRoles('Student', 'Faculty'), taskController.createTask);

// FR7: Update task status (Pending, In Progress, Completed)
router.patch('/:taskId/status', authenticateToken, taskController.updateTaskStatus);

// Edit task
router.put('/:taskId', authenticateToken, taskController.updateTask);

// Delete task
router.delete('/:taskId', authenticateToken, taskController.deleteTask);

// Tasks for a project
router.get('/project/:projectId', authenticateToken, taskController.getProjectTasks);

// Tasks assigned to current student
router.get('/my-tasks', authenticateToken, taskController.getMyTasks);

module.exports = router;
