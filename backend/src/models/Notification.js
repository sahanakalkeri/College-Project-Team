const { get, query, run } = require('../config/db');

class Notification {
  constructor({ notificationId, userId, message, date, isRead, link }) {
    this.notificationId = notificationId;
    this.userId = userId;
    this.message = message;
    this.date = date;
    this.isRead = Boolean(isRead);
    this.link = link || null;
  }

  // UML Method: sendNotification(): void
  static async sendNotification(userId, message, link = null) {
    if (!userId || !message) {
      throw new Error('UserId and message are required.');
    }

    const result = await run(
      'INSERT INTO notifications (userId, message, link) VALUES (?, ?, ?)',
      [userId, message.trim(), link]
    );

    return Number(result.lastInsertRowid);
  }

  // UML Method: markAsRead(): void
  async markAsRead() {
    this.isRead = true;
    await run('UPDATE notifications SET isRead = 1 WHERE notificationId = ?', [this.notificationId]);
    return this;
  }

  static async markAllAsReadForUser(userId) {
    await run('UPDATE notifications SET isRead = 1 WHERE userId = ?', [userId]);
    return true;
  }

  static async getForUser(userId) {
    const rows = await query(
      'SELECT * FROM notifications WHERE userId = ? ORDER BY date DESC LIMIT 50',
      [userId]
    );
    return rows.map((r) => new Notification(r));
  }

  static async getUnreadCount(userId) {
    const res = await get('SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0', [userId]);
    return res ? res.count : 0;
  }

  static async findById(notificationId) {
    const row = await get('SELECT * FROM notifications WHERE notificationId = ?', [notificationId]);
    return row ? new Notification(row) : null;
  }
}

module.exports = Notification;
