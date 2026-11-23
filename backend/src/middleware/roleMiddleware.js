const { get } = require('../config/db');

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] roles.`
      });
    }
    next();
  };
}

/**
 * Ensures the student is the designated TeamLeader of the target team
 */
async function requireTeamLeader(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'Student') {
      return res.status(403).json({ success: false, message: 'Must be a student to lead a team.' });
    }

    const teamId = req.params.teamId || req.body.teamId;
    if (!teamId) {
      return res.status(400).json({ success: false, message: 'Team ID is required.' });
    }

    const team = await get('SELECT leaderId FROM teams WHERE teamId = ?', [teamId]);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.leaderId !== req.user.studentId) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only the Team Leader can perform this action.'
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authorizeRoles, requireTeamLeader };
