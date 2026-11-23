const Student = require('../models/Student');
const Project = require('../models/Project');
const Team = require('../models/Team');
const Notification = require('../models/Notification');
const { get, query, run } = require('../config/db');

// Standard suggested project topics for easy selection
const SUGGESTED_TOPICS = [
  {
    topic: 'AI-Powered Campus Navigation & Accessibility System',
    department: 'Computer Science',
    description: 'An indoor routing and accessibility mobile/web application using graph theory and beacon positioning.'
  },
  {
    topic: 'Decentralized Academic Credential Verification using Blockchain',
    department: 'Information Science',
    description: 'Tamper-proof storage and verification of diplomas and transcripts using smart contracts.'
  },
  {
    topic: 'Smart IoT Energy Monitoring & Conservation for Smart Campuses',
    department: 'Electrical & Electronics',
    description: 'Real-time telemetry and predictive control to optimize power consumption across campus facilities.'
  },
  {
    topic: 'Healthcare Teleconsultation & Electronic Health Record Platform',
    department: 'Computer Science',
    description: 'HIPAA-compliant telemedicine portal with automated appointment triage and patient health history tracking.'
  },
  {
    topic: 'Automated Code Review & Security Vulnerability Scanner',
    department: 'Software Engineering',
    description: 'Static analysis tool integrating AST parsing and rule engines to discover code smells and vulnerabilities.'
  },
  {
    topic: 'Predictive Student Placement Analytics & Skill Gap Recommender',
    department: 'Data Science',
    description: 'Machine learning model predicting campus placement likelihood and suggesting curriculum pathways.'
  }
];

async function getStandardTopics(req, res) {
  res.json({ success: true, data: SUGGESTED_TOPICS });
}

async function selectOrProposeTopic(req, res) {
  try {
    const student = await Student.findByUserId(req.user.userId);
    if (!student) {
      return res.status(403).json({ success: false, message: 'Only students can select project topics.' });
    }

    const { teamId, topic, description, isCustom = false } = req.body;
    if (!teamId || !topic || topic.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Team ID and topic title are required.' });
    }

    // Call student method: selectProjectTopic()
    await student.selectProjectTopic(teamId, topic, description);

    // Notify team members
    const members = await query(
      `SELECT s.userId FROM team_members tm
       JOIN students s ON tm.studentId = s.studentId
       WHERE tm.teamId = ? AND s.userId != ?`,
      [teamId, req.user.userId]
    );

    for (const m of members) {
      await Notification.sendNotification(
        m.userId,
        `Project topic updated to: "${topic.trim()}" by ${req.user.name}.`,
        '/project'
      );
    }

    res.json({
      success: true,
      message: isCustom ? 'Custom project topic proposed successfully!' : 'Project topic selected successfully!',
      data: { topic: topic.trim(), description }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function submitForReview(req, res) {
  try {
    const { projectId, comments } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    // Verify user is leader of the team
    const team = await Team.findById(project.teamId);
    if (team.leaderId !== req.user.studentId) {
      return res.status(403).json({ success: false, message: 'Only the Team Leader can submit the project for review.' });
    }

    // Update status to 'Submitted' (Activity Diagram: Faculty Review submission)
    await project.updateStatus('Submitted');

    // Notify all faculty members
    const faculties = await query('SELECT userId FROM faculty');
    for (const f of faculties) {
      await Notification.sendNotification(
        f.userId,
        `Team "${team.teamName}" has submitted project "${project.title}" for review.`,
        '/faculty'
      );
    }

    // Also notify team members
    const members = await query(
      `SELECT s.userId FROM team_members tm
       JOIN students s ON tm.studentId = s.studentId
       WHERE tm.teamId = ? AND s.userId != ?`,
      [team.teamId, req.user.userId]
    );
    for (const m of members) {
      await Notification.sendNotification(
        m.userId,
        `Team Leader ${req.user.name} submitted project "${project.title}" for faculty review.`,
        '/review'
      );
    }

    res.json({
      success: true,
      message: 'Project successfully submitted for faculty review!',
      data: { status: 'Submitted' }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getProjectDetails(req, res) {
  try {
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const details = await project.viewDetails();
    res.json({ success: true, data: details });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function updateProjectDetails(req, res) {
  try {
    const { projectId } = req.params;
    const { title, description, deadline } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const team = await Team.findById(project.teamId);
    if (team.leaderId !== req.user.studentId && req.user.role !== 'Faculty' && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    const updates = [];
    const params = [];
    if (title) {
      updates.push('title = ?');
      params.push(title.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description.trim());
    }
    if (deadline) {
      updates.push('deadline = ?');
      params.push(deadline);
    }

    if (updates.length > 0) {
      params.push(projectId);
      await run(`UPDATE projects SET ${updates.join(', ')} WHERE projectId = ?`, params);
    }

    res.json({ success: true, message: 'Project updated successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getStandardTopics,
  selectOrProposeTopic,
  submitForReview,
  getProjectDetails,
  updateProjectDetails
};
