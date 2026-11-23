const { get, query, run } = require('../config/db');

class Task {
  constructor({ taskId, projectId, title, description, priority, status, dueDate, assignedTo, createdOn }) {
    this.taskId = taskId;
    this.projectId = projectId;
    this.title = title;
    this.description = description;
    this.priority = priority || 'Medium';
    this.status = status || 'Pending';
    this.dueDate = dueDate;
    this.assignedTo = assignedTo;
    this.createdOn = createdOn;
  }

  // UML Method: assignTask(): void
  static async assignTask({ projectId, title, description, priority = 'Medium', dueDate, assignedTo }) {
    if (!title || title.trim().length === 0) {
      throw new Error('Task title cannot be empty.');
    }

    const validPriorities = ['Low', 'Medium', 'High'];
    const p = validPriorities.includes(priority) ? priority : 'Medium';

    const result = await run(
      'INSERT INTO tasks (projectId, title, description, priority, status, dueDate, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [projectId, title.trim(), description || '', p, 'Pending', dueDate || null, assignedTo || null]
    );

    return Number(result.lastInsertRowid);
  }

  // UML Method: updateStatus(): void
  async updateStatus(newStatus) {
    const valid = ['Pending', 'In Progress', 'Completed'];
    if (!valid.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    this.status = newStatus;
    await run('UPDATE tasks SET status = ? WHERE taskId = ?', [newStatus, this.taskId]);

    // Notify project members or leader about completion
    if (newStatus === 'Completed') {
      const proj = await get(
        `SELECT p.title, t.leaderId, s.userId as leaderUserId
         FROM tasks tk
         JOIN projects p ON tk.projectId = p.projectId
         JOIN teams t ON p.teamId = t.teamId
         JOIN students s ON t.leaderId = s.studentId
         WHERE tk.taskId = ?`,
        [this.taskId]
      );
      if (proj) {
        await run(
          'INSERT INTO notifications (userId, message, link) VALUES (?, ?, ?)',
          [proj.leaderUserId, `Task "${this.title}" was marked as Completed.`, '/tasks']
        );
      }
    }

    return this;
  }

  // UML Method: trackProgress(): void
  static async trackProgress(projectId) {
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
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pending: counts ? (counts.pending || 0) : 0,
      inProgress: counts ? (counts.inProgress || 0) : 0,
      completed,
      completionRate: rate
    };
  }

  static async findById(taskId) {
    const row = await get('SELECT * FROM tasks WHERE taskId = ?', [taskId]);
    return row ? new Task(row) : null;
  }
}

module.exports = Task;
