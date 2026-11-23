const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// FR4: Search teams
router.get('/search', authenticateToken, teamController.searchTeams);

// FR3: Create new team (Student only)
router.post('/create', authenticateToken, authorizeRoles('Student'), teamController.createTeam);

// FR4: Join team
router.post('/join', authenticateToken, authorizeRoles('Student'), teamController.joinTeam);

// Get current student's team
router.get('/my-team', authenticateToken, authorizeRoles('Student'), teamController.getMyTeam);

// FR5: Team leader add member
router.post('/members/add', authenticateToken, authorizeRoles('Student'), teamController.addMember);

// FR5: Team leader remove member
router.post('/members/remove', authenticateToken, authorizeRoles('Student'), teamController.removeMember);

// Available students for inviting
router.get('/available-students', authenticateToken, authorizeRoles('Student', 'Faculty', 'Admin'), teamController.getAvailableStudents);

// View team details
router.get('/:teamId', authenticateToken, teamController.getTeamDetails);

module.exports = router;
