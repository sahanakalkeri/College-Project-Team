const jwt = require('jsonwebtoken');
const { get, query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_college_jwt_key_2026_secure';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
    }

    try {
      // Verify user exists and is active
      const user = await get('SELECT userId, name, email, role, profilePic, isActive FROM users WHERE userId = ?', [decoded.userId]);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User account not found.' });
      }
      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
      }

      req.user = { ...user };

      // Attach role-specific IDs
      if (user.role === 'Student') {
        const student = await get('SELECT studentId, semester, department, cgpa FROM students WHERE userId = ?', [user.userId]);
        if (student) {
          req.user.studentId = student.studentId;
          req.user.semester = student.semester;
          req.user.department = student.department;
          req.user.cgpa = student.cgpa;

          // Check teams they lead
          const ledTeams = await query('SELECT teamId FROM teams WHERE leaderId = ?', [student.studentId]);
          req.user.isLeader = ledTeams.length > 0;
          req.user.ledTeamIds = ledTeams.map((t) => t.teamId);
        }
      } else if (user.role === 'Faculty') {
        const faculty = await get('SELECT facultyId, department, designation FROM faculty WHERE userId = ?', [user.userId]);
        if (faculty) {
          req.user.facultyId = faculty.facultyId;
          req.user.department = faculty.department;
          req.user.designation = faculty.designation;
        }
      } else if (user.role === 'Admin') {
        const admin = await get('SELECT adminId, department FROM admins WHERE userId = ?', [user.userId]);
        if (admin) {
          req.user.adminId = admin.adminId;
          req.user.department = admin.department;
        }
      }

      next();
    } catch (dbErr) {
      next(dbErr);
    }
  });
}

module.exports = { authenticateToken };
