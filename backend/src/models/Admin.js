const User = require('./User');
const { get, query, run, transaction } = require('../config/db');

class Admin extends User {
  constructor({ userId, name, email, password, role, profilePic, isActive, adminId, department }) {
    super({ userId, name, email, password, role, profilePic, isActive });
    this.adminId = adminId;
    this.department = department;
  }

  // UML Method: manageUsers(): void
  async manageUsers(action, targetUserId, updateData = {}) {
    const target = await User.findById(targetUserId);
    if (!target) throw new Error('Target user not found.');

    if (action === 'toggleActive') {
      const newStatus = target.isActive ? 0 : 1;
      await run('UPDATE users SET isActive = ? WHERE userId = ?', [newStatus, targetUserId]);
      return { message: `User status updated to ${newStatus ? 'Active' : 'Inactive'}` };
    }

    if (action === 'delete') {
      // Prevent deleting self
      if (this.userId === targetUserId) {
        throw new Error('You cannot delete your own admin account.');
      }
      await run('DELETE FROM users WHERE userId = ?', [targetUserId]);
      return { message: 'User deleted successfully.' };
    }

    if (action === 'update') {
      await target.updateProfile(updateData);
      return { message: 'User updated successfully.' };
    }

    throw new Error('Unsupported management action.');
  }

  // UML Method: generateReports(): void
  async generateReports(reportType = 'System Summary') {
    const totalUsersRow = await get('SELECT COUNT(*) as count FROM users');
    const totalStudentsRow = await get('SELECT COUNT(*) as count FROM students');
    const totalFacultyRow = await get('SELECT COUNT(*) as count FROM faculty');
    const totalTeamsRow = await get('SELECT COUNT(*) as count FROM teams');
    const totalProjectsRow = await get('SELECT COUNT(*) as count FROM projects');
    const projectsByStatus = await query('SELECT status, COUNT(*) as count FROM projects GROUP BY status');
    const tasksTotalRow = await get('SELECT COUNT(*) as count FROM tasks');
    const tasksCompletedRow = await get("SELECT COUNT(*) as count FROM tasks WHERE status = 'Completed'");
    const avgFeedbackRow = await get('SELECT AVG(rating) as avg FROM feedback');

    const totalUsers = totalUsersRow ? totalUsersRow.count : 0;
    const totalStudents = totalStudentsRow ? totalStudentsRow.count : 0;
    const totalFaculty = totalFacultyRow ? totalFacultyRow.count : 0;
    const totalTeams = totalTeamsRow ? totalTeamsRow.count : 0;
    const totalProjects = totalProjectsRow ? totalProjectsRow.count : 0;
    const tasksTotal = tasksTotalRow ? tasksTotalRow.count : 0;
    const tasksCompleted = tasksCompletedRow ? tasksCompletedRow.count : 0;
    const avgFeedbackRating = avgFeedbackRow && avgFeedbackRow.avg ? parseFloat(avgFeedbackRow.avg).toFixed(2) : 0;

    const summary = {
      reportType,
      generatedAt: new Date().toISOString(),
      stats: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalTeams,
        totalProjects,
        projectsByStatus,
        tasksTotal,
        tasksCompleted,
        taskCompletionRate: tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0,
        avgFeedbackRating
      }
    };

    const result = await run(
      'INSERT INTO reports (adminId, reportType, summaryData) VALUES (?, ?, ?)',
      [this.adminId, reportType, JSON.stringify(summary)]
    );

    return {
      reportId: Number(result.lastInsertRowid),
      adminId: this.adminId,
      reportType,
      summaryData: summary,
      generatedOn: new Date().toISOString()
    };
  }

  static async findByUserId(userId) {
    const row = await get(
      `SELECT u.*, a.adminId, a.department
       FROM users u
       JOIN admins a ON u.userId = a.userId
       WHERE u.userId = ?`,
      [userId]
    );
    return row ? new Admin(row) : null;
  }
}

module.exports = Admin;
