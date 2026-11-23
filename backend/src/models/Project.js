const { get, query, run } = require('../config/db');

class Project {
  constructor({ projectId, teamId, facultyId, title, description, status, deadline, createdOn }) {
    this.projectId = projectId;
    this.teamId = teamId;
    this.facultyId = facultyId;
    this.title = title;
    this.description = description;
    this.status = status || 'Draft';
    this.deadline = deadline;
    this.createdOn = createdOn;
  }

  // UML Method: createProject(): void
  static async createProject({ teamId, title, description, deadline, facultyId = null }) {
    if (!title || title.trim().length === 0) {
      throw new Error('Project title is required.');
    }

    const result = await run(
      'INSERT INTO projects (teamId, facultyId, title, description, status, deadline) VALUES (?, ?, ?, ?, ?, ?)',
      [teamId, facultyId, title.trim(), description || '', 'Draft', deadline || null]
    );

    return Number(result.lastInsertRowid);
  }

  // UML Method: updateStatus(): void
  async updateStatus(newStatus) {
    const validStatuses = ['Draft', 'Submitted', 'Needs Changes', 'Approved', 'Proposing', 'Submitted for Review', 'In Progress', 'Completed'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    this.status = newStatus;
    await run('UPDATE projects SET status = ? WHERE projectId = ?', [newStatus, this.projectId]);
    return this;
  }

  // UML Method: viewDetails(): void
  async viewDetails() {
    const project = await get(
      `SELECT p.*, t.teamName, t.projectTopic, t.leaderId,
              u.name as leaderName, u.email as leaderEmail,
              fu.name as facultyName, fu.email as facultyEmail, f.designation as facultyDesignation
       FROM projects p
       JOIN teams t ON p.teamId = t.teamId
       JOIN students s ON t.leaderId = s.studentId
       JOIN users u ON s.userId = u.userId
       LEFT JOIN faculty f ON p.facultyId = f.facultyId
       LEFT JOIN users fu ON f.userId = fu.userId
       WHERE p.projectId = ?`,
      [this.projectId]
    );

    const tasks = await query(
      `SELECT t.*, u.name as assignedToName, u.email as assignedToEmail
       FROM tasks t
       LEFT JOIN students s ON t.assignedTo = s.studentId
       LEFT JOIN users u ON s.userId = u.userId
       WHERE t.projectId = ?
       ORDER BY t.dueDate ASC`,
      [this.projectId]
    );

    const feedback = await query(
      `SELECT fb.*, u.name as facultyName, f.designation
       FROM feedback fb
       JOIN faculty f ON fb.facultyId = f.facultyId
       JOIN users u ON f.userId = u.userId
       WHERE fb.projectId = ?
       ORDER BY fb.date DESC`,
      [this.projectId]
    );

    return { ...project, tasks, feedback };
  }

  static async findById(projectId) {
    const row = await get('SELECT * FROM projects WHERE projectId = ?', [projectId]);
    return row ? new Project(row) : null;
  }

  static async findByTeamId(teamId) {
    const row = await get('SELECT * FROM projects WHERE teamId = ?', [teamId]);
    return row ? new Project(row) : null;
  }
}

module.exports = Project;
