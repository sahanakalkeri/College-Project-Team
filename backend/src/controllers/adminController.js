const Admin = require('../models/Admin');
const Report = require('../models/Report');
const User = require('../models/User');
const { get, query, run } = require('../config/db');

async function getUsers(req, res) {
  try {
    const { search = '', role = '', page = 1, limit = 15 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    let whereClauses = [];
    let params = [];

    if (search.trim()) {
      whereClauses.push('(u.name LIKE ? OR u.email LIKE ?)');
      const p = `%${search.trim()}%`;
      params.push(p, p);
    }
    if (role.trim()) {
      whereClauses.push('u.role = ?');
      params.push(role.trim());
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as count FROM users u ${whereSql}`;
    const countRow = await get(countSql, params);
    const totalCount = countRow ? countRow.count : 0;

    const dataSql = `
      SELECT u.userId, u.name, u.email, u.role, u.profilePic, u.isActive, u.createdAt,
             s.studentId, s.semester, s.department as studentDept, s.cgpa,
             f.facultyId, f.department as facultyDept, f.designation,
             a.adminId, a.department as adminDept
      FROM users u
      LEFT JOIN students s ON u.userId = s.userId
      LEFT JOIN faculty f ON u.userId = f.userId
      LEFT JOIN admins a ON u.userId = a.userId
      ${whereSql}
      ORDER BY u.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const users = await query(dataSql, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: users,
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

async function manageUserAction(req, res) {
  try {
    const admin = await Admin.findByUserId(req.user.userId);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Admin account not found.' });
    }

    const { userId } = req.params;
    const { action, updateData } = req.body;

    const result = await admin.manageUsers(action, parseInt(userId), updateData);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function generateReport(req, res) {
  try {
    const admin = await Admin.findByUserId(req.user.userId);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Admin account not found.' });
    }

    const { reportType = 'Comprehensive College Project Audit' } = req.body;
    const report = await admin.generateReports(reportType);

    res.status(201).json({
      success: true,
      message: 'Report generated successfully.',
      data: report
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function listReports(req, res) {
  try {
    const reports = await Report.getAll();
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getReportById(req, res) {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    res.json({ success: true, data: report.viewReport() });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function exportCsv(req, res) {
  try {
    const { type = 'teams' } = req.query;

    let csvContent = '';
    let filename = `report_${type}_${Date.now()}.csv`;

    if (type === 'teams') {
      const teams = await query(
        `SELECT t.teamId, t.teamName, t.projectTopic, u.name as leaderName, u.email as leaderEmail,
                p.status as projectStatus, p.deadline,
                (SELECT COUNT(*) FROM team_members tm WHERE tm.teamId = t.teamId) as memberCount,
                (SELECT COUNT(*) FROM tasks tk WHERE tk.projectId = p.projectId) as taskCount,
                (SELECT COUNT(*) FROM tasks tk WHERE tk.projectId = p.projectId AND tk.status = 'Completed') as completedTasks
         FROM teams t
         JOIN students s ON t.leaderId = s.studentId
         JOIN users u ON s.userId = u.userId
         LEFT JOIN projects p ON p.teamId = t.teamId`
      );

      csvContent = 'Team ID,Team Name,Topic,Leader Name,Leader Email,Status,Members,Total Tasks,Completed Tasks\n';
      teams.forEach((t) => {
        csvContent += `"${t.teamId}","${t.teamName}","${t.projectTopic || ''}","${t.leaderName}","${t.leaderEmail}","${t.projectStatus || 'Proposing'}","${t.memberCount}","${t.taskCount}","${t.completedTasks}"\n`;
      });
    } else if (type === 'users') {
      const users = await query(
        `SELECT userId, name, email, role, isActive, createdAt FROM users ORDER BY userId ASC`
      );
      csvContent = 'User ID,Name,Email,Role,Is Active,Created At\n';
      users.forEach((u) => {
        csvContent += `"${u.userId}","${u.name}","${u.email}","${u.role}","${u.isActive ? 'Active' : 'Inactive'}","${u.createdAt}"\n`;
      });
    } else if (type === 'tasks') {
      const tasks = await query(
        `SELECT tk.taskId, tk.title, tk.status, tk.dueDate, p.title as projectTitle, t.teamName, u.name as assignedTo
         FROM tasks tk
         JOIN projects p ON tk.projectId = p.projectId
         JOIN teams t ON p.teamId = t.teamId
         LEFT JOIN students s ON tk.assignedTo = s.studentId
         LEFT JOIN users u ON s.userId = u.userId`
      );
      csvContent = 'Task ID,Title,Status,Due Date,Project,Team,Assigned To\n';
      tasks.forEach((tk) => {
        csvContent += `"${tk.taskId}","${tk.title}","${tk.status}","${tk.dueDate || ''}","${tk.projectTitle}","${tk.teamName}","${tk.assignedTo || 'Unassigned'}"\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getUsers,
  manageUserAction,
  generateReport,
  listReports,
  getReportById,
  exportCsv
};
