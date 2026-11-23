const Student = require('../models/Student');
const TeamLeader = require('../models/TeamLeader');
const Team = require('../models/Team');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { get, query, run } = require('../config/db');

async function createTeam(req, res) {
  try {
    const student = await Student.findByUserId(req.user.userId);
    if (!student) {
      return res.status(403).json({ success: false, message: 'Only students can create a team.' });
    }

    const { teamName, projectTopic } = req.body;
    if (!teamName || teamName.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Team name must be at least 3 characters long.' });
    }

    // Check unique team name
    const existing = await get('SELECT teamId FROM teams WHERE teamName = ?', [teamName.trim()]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'A team with this name already exists.' });
    }

    // Execute UML method: createTeam()
    const teamId = await student.createTeam(teamName, projectTopic);

    await Notification.sendNotification(
      req.user.userId,
      `Team "${teamName}" created successfully! You are now the Team Leader.`,
      '/team'
    );

    res.status(201).json({
      success: true,
      message: 'Team created successfully!',
      data: { teamId }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function searchTeams(req, res) {
  try {
    const { keyword = '', page = 1, limit = 10 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const searchPattern = `%${keyword.trim()}%`;

    const countRow = await get(
      `SELECT COUNT(*) as count FROM teams WHERE teamName LIKE ? OR projectTopic LIKE ?`,
      [searchPattern, searchPattern]
    );
    const totalCount = countRow ? countRow.count : 0;

    const teams = await query(
      `SELECT t.*, u.name as leaderName, u.email as leaderEmail,
              p.projectId, p.title as projectTitle, p.status as projectStatus,
              (SELECT COUNT(*) FROM team_members tm WHERE tm.teamId = t.teamId) as memberCount
       FROM teams t
       JOIN students s ON t.leaderId = s.studentId
       JOIN users u ON s.userId = u.userId
       LEFT JOIN projects p ON p.teamId = t.teamId
       WHERE t.teamName LIKE ? OR t.projectTopic LIKE ?
       ORDER BY t.createdOn DESC
       LIMIT ? OFFSET ?`,
      [searchPattern, searchPattern, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: teams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function joinTeam(req, res) {
  try {
    const student = await Student.findByUserId(req.user.userId);
    if (!student) {
      return res.status(403).json({ success: false, message: 'Only students can join teams.' });
    }

    const { teamId } = req.body;
    if (!teamId) {
      return res.status(400).json({ success: false, message: 'Team ID is required.' });
    }

    await student.joinTeam(teamId);

    await Notification.sendNotification(
      req.user.userId,
      `You have successfully joined the team.`,
      '/team'
    );

    res.json({
      success: true,
      message: 'Successfully joined the team!'
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getMyTeam(req, res) {
  try {
    const student = await Student.findByUserId(req.user.userId);
    if (!student) {
      return res.status(403).json({ success: false, message: 'Only students have student teams.' });
    }

    // Find teams student is part of
    const memberRow = await get(
      `SELECT t.teamId FROM team_members tm
       JOIN teams t ON tm.teamId = t.teamId
       WHERE tm.studentId = ?
       ORDER BY tm.joinedOn DESC LIMIT 1`,
      [student.studentId]
    );

    if (!memberRow) {
      return res.json({ success: true, data: null, message: 'You are not in any team yet.' });
    }

    const team = await Team.findById(memberRow.teamId);
    if (!team) {
      return res.json({ success: true, data: null });
    }

    // Ensure a project row exists for this team so Task Management is always fully active
    let project = await get('SELECT * FROM projects WHERE teamId = ?', [team.teamId]);
    if (!project) {
      await run(
        'INSERT INTO projects (teamId, title, description, status) VALUES (?, ?, ?, ?)',
        [
          team.teamId,
          team.projectTopic ? team.projectTopic.trim() : `${team.teamName.trim()} Project`,
          'Initial project setup pending detailed description and faculty review.',
          'Draft'
        ]
      );
    }

    const teamDetails = await team.viewTeam();
    const isLeader = Number(team.leaderId) === Number(student.studentId);

    res.json({
      success: true,
      data: {
        ...teamDetails,
        isCurrentUserLeader: isLeader,
        currentStudentId: student.studentId
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function addMember(req, res) {
  try {
    const { teamId, studentId, studentEmail } = req.body;
    const tid = teamId || (req.user.ledTeamIds && req.user.ledTeamIds[0]);
    if (!tid) return res.status(400).json({ success: false, message: 'Team ID is required.' });

    const team = await Team.findById(tid);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });

    // Verify leader
    if (Number(team.leaderId) !== Number(req.user.studentId)) {
      return res.status(403).json({ success: false, message: 'Only the Team Leader can add members.' });
    }

    let targetStudentId = studentId ? parseInt(studentId, 10) : null;
    if (!targetStudentId && studentEmail) {
      const studentRow = await get(
        `SELECT s.studentId FROM students s
         JOIN users u ON s.userId = u.userId
         WHERE LOWER(u.email) = ?`,
        [studentEmail.toLowerCase().trim()]
      );
      if (!studentRow) {
        return res.status(404).json({ success: false, message: `No registered student found with email "${studentEmail}".` });
      }
      targetStudentId = studentRow.studentId;
    }

    if (!targetStudentId) {
      return res.status(400).json({ success: false, message: 'Please provide a valid student ID or email.' });
    }

    await team.addMember(targetStudentId);

    res.json({
      success: true,
      message: 'Member added successfully!'
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function removeMember(req, res) {
  try {
    const { teamId, studentId } = req.body;
    const tid = teamId || (req.user.ledTeamIds && req.user.ledTeamIds[0]);
    if (!tid) return res.status(400).json({ success: false, message: 'Team ID is required.' });

    const team = await Team.findById(tid);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });

    // Verify requester is the team leader
    if (Number(team.leaderId) !== Number(req.user.studentId)) {
      return res.status(403).json({ success: false, message: 'Only the Team Leader can remove members.' });
    }

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required to remove member.' });
    }

    const sid = parseInt(studentId, 10);
    if (Number(team.leaderId) === sid) {
      return res.status(400).json({ success: false, message: 'The team leader cannot remove themselves.' });
    }

    await team.removeMember(sid);

    res.json({
      success: true,
      message: 'Member removed from team.'
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getTeamDetails(req, res) {
  try {
    const teamId = req.params.teamId;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });

    const details = await team.viewTeam();
    res.json({ success: true, data: details });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getAvailableStudents(req, res) {
  try {
    const { keyword = '' } = req.query;
    const pattern = `%${keyword.trim()}%`;
    // Return only students who are not yet in ANY team
    const students = await query(
      `SELECT s.studentId, s.semester, s.department, s.cgpa, u.name, u.email, u.profilePic
       FROM students s
       JOIN users u ON s.userId = u.userId
       WHERE u.isActive = 1
       AND s.studentId NOT IN (SELECT tm.studentId FROM team_members tm)
       AND (u.name LIKE ? OR u.email LIKE ?)
       ORDER BY u.name ASC`,
      [pattern, pattern]
    );
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  createTeam,
  searchTeams,
  joinTeam,
  getMyTeam,
  addMember,
  removeMember,
  getTeamDetails,
  getAvailableStudents
};
