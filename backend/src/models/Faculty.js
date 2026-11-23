const User = require('./User');
const { get, query, run, transaction } = require('../config/db');

class Faculty extends User {
  constructor({ userId, name, email, password, role, profilePic, isActive, facultyId, department, designation }) {
    super({ userId, name, email, password, role, profilePic, isActive });
    this.facultyId = facultyId;
    this.department = department;
    this.designation = designation;
  }

  // UML Method: viewTeams(): List<Team>
  async viewTeams() {
    return await query(
      `SELECT t.*, u.name as leaderName, u.email as leaderEmail,
              p.projectId, p.title as projectTitle, p.status as projectStatus, p.deadline as projectDeadline,
              p.facultyId,
              (SELECT COUNT(*) FROM team_members tm WHERE tm.teamId = t.teamId) as memberCount,
              (SELECT COUNT(*) FROM tasks tk WHERE tk.projectId = p.projectId) as taskCount,
              (SELECT COUNT(*) FROM tasks tk WHERE tk.projectId = p.projectId AND tk.status = 'Completed') as completedTaskCount
       FROM teams t
       JOIN students s ON t.leaderId = s.studentId
       JOIN users u ON s.userId = u.userId
       LEFT JOIN projects p ON p.teamId = t.teamId
       ORDER BY t.createdOn DESC`
    );
  }

  // UML Method: viewProjectDetails(projectId): void
  async viewProjectDetails(projectId) {
    const project = await get(
      `SELECT p.*, t.teamName, t.projectTopic,
              u.name as leaderName, u.email as leaderEmail,
              f.designation as facultyDesignation, fu.name as facultyName
       FROM projects p
       JOIN teams t ON p.teamId = t.teamId
       JOIN students s ON t.leaderId = s.studentId
       JOIN users u ON s.userId = u.userId
       LEFT JOIN faculty f ON p.facultyId = f.facultyId
       LEFT JOIN users fu ON f.userId = fu.userId
       WHERE p.projectId = ?`,
      [projectId]
    );
    if (!project) throw new Error('Project not found.');

    const members = await query(
      `SELECT s.studentId, s.semester, s.department, s.cgpa, u.name, u.email, u.profilePic,
              CASE WHEN s.studentId = (SELECT leaderId FROM teams WHERE teamId = ?) THEN 1 ELSE 0 END as isLeader
       FROM team_members tm
       JOIN students s ON tm.studentId = s.studentId
       JOIN users u ON s.userId = u.userId
       WHERE tm.teamId = ?`,
      [project.teamId, project.teamId]
    );

    const tasks = await query(
      `SELECT t.*, u.name as assignedToName
       FROM tasks t
       LEFT JOIN students s ON t.assignedTo = s.studentId
       LEFT JOIN users u ON s.userId = u.userId
       WHERE t.projectId = ?
       ORDER BY t.dueDate ASC`,
      [projectId]
    );

    const feedbacks = await query(
      `SELECT fb.*, u.name as facultyName, f.designation
       FROM feedback fb
       JOIN faculty f ON fb.facultyId = f.facultyId
       JOIN users u ON f.userId = u.userId
       WHERE fb.projectId = ?
       ORDER BY fb.date DESC`,
      [projectId]
    );

    return { ...project, members, tasks, feedbacks };
  }

  // UML Method: viewTaskProgress(projectId): void
  async viewTaskProgress(projectId) {
    const counts = await get(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as inProgress,
         SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
       FROM tasks WHERE projectId = ?`,
      [projectId]
    );

    const total = counts ? (counts.total || 0) : 0;
    const completed = counts ? (counts.completed || 0) : 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pending: counts ? (counts.pending || 0) : 0,
      inProgress: counts ? (counts.inProgress || 0) : 0,
      completed,
      percentage
    };
  }

  // UML Method: provideFeedback(): void
  async provideFeedback(projectId, { comments, rating, taskId = null, newStatus = null }) {
    if (!comments || comments.trim().length === 0) {
      throw new Error('Feedback comment is required.');
    }
    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new Error('Rating must be between 1 and 5 stars.');
    }

    return await transaction(async () => {
      // 1. Insert feedback record
      const result = await run(
        'INSERT INTO feedback (projectId, taskId, facultyId, comments, rating) VALUES (?, ?, ?, ?, ?)',
        [projectId, taskId || null, this.facultyId, comments.trim(), parsedRating]
      );

      // 2. Assign faculty to project if not already assigned
      await run(
        'UPDATE projects SET facultyId = ? WHERE projectId = ? AND facultyId IS NULL',
        [this.facultyId, projectId]
      );

      // 3. Update project status if approved / needs changes / etc.
      if (newStatus) {
        await run('UPDATE projects SET status = ? WHERE projectId = ?', [newStatus, projectId]);
      }

      // 4. Notify team members and faculty
      const project = await get('SELECT teamId, title FROM projects WHERE projectId = ?', [projectId]);
      if (project) {
        const teamMembers = await query(
          `SELECT s.userId FROM team_members tm
           JOIN students s ON tm.studentId = s.studentId
           WHERE tm.teamId = ?`,
          [project.teamId]
        );

        const notifMessage = newStatus === 'Approved'
          ? `Project "${project.title}" has been APPROVED by Faculty ${this.name} (${parsedRating}★)! Milestone certified.`
          : newStatus === 'Needs Changes'
          ? `Project "${project.title}" NEEDS CHANGES: Faculty ${this.name} requested task revisions (${parsedRating}★). Please modify/reassign tasks and resubmit.`
          : `Faculty ${this.name} gave feedback (${parsedRating}★) on project "${project.title}": Status updated to ${newStatus}.`;

        for (const member of teamMembers) {
          await run(
            'INSERT INTO notifications (userId, message, link) VALUES (?, ?, ?)',
            [member.userId, notifMessage, '/review']
          );
        }

        // Notify faculty user of completed review
        await run(
          'INSERT INTO notifications (userId, message, link) VALUES (?, ?, ?)',
          [
            this.userId,
            `You submitted review for team project "${project.title}" with decision: ${newStatus} (${parsedRating}★). Data stored in records.`,
            '/faculty'
          ]
        );
      }

      return Number(result.lastInsertRowid);
    });
  }

  static async findByUserId(userId) {
    const row = await get(
      `SELECT u.*, f.facultyId, f.department, f.designation
       FROM users u
       JOIN faculty f ON u.userId = f.userId
       WHERE u.userId = ?`,
      [userId]
    );
    return row ? new Faculty(row) : null;
  }
}

module.exports = Faculty;
