const { get, query, run } = require('../config/db');

class Feedback {
  constructor({ feedbackId, projectId, taskId, facultyId, comments, rating, date }) {
    this.feedbackId = feedbackId;
    this.projectId = projectId;
    this.taskId = taskId;
    this.facultyId = facultyId;
    this.comments = comments;
    this.rating = rating;
    this.date = date;
  }

  // UML Method: submitFeedback(): void
  static async submitFeedback({ projectId, taskId = null, facultyId, comments, rating }) {
    if (!comments || comments.trim().length === 0) {
      throw new Error('Comments cannot be empty.');
    }
    const rate = parseInt(rating, 10);
    if (isNaN(rate) || rate < 1 || rate > 5) {
      throw new Error('Rating must be an integer between 1 and 5.');
    }

    const result = await run(
      'INSERT INTO feedback (projectId, taskId, facultyId, comments, rating) VALUES (?, ?, ?, ?, ?)',
      [projectId, taskId, facultyId, comments.trim(), rate]
    );

    return Number(result.lastInsertRowid);
  }

  // UML Method: viewFeedback(projectId): List<Feedback>
  static async viewFeedback(projectId) {
    return await query(
      `SELECT fb.*, u.name as facultyName, u.email as facultyEmail, f.designation, f.department
       FROM feedback fb
       JOIN faculty f ON fb.facultyId = f.facultyId
       JOIN users u ON f.userId = u.userId
       WHERE fb.projectId = ?
       ORDER BY fb.date DESC`,
      [projectId]
    );
  }

  static async findById(feedbackId) {
    const row = await get('SELECT * FROM feedback WHERE feedbackId = ?', [feedbackId]);
    return row ? new Feedback(row) : null;
  }
}

module.exports = Feedback;
