const bcrypt = require('bcryptjs');
const { query, get, run } = require('../config/db');

class User {
  constructor({ userId, name, email, password, role, profilePic, isActive = 1 }) {
    this.userId = userId;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
    this.profilePic = profilePic || null;
    this.isActive = isActive;
  }

  // UML Method: login(): boolean
  static async login(email, rawPassword) {
    const userRow = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!userRow) return null;
    if (!userRow.isActive) {
      throw new Error('Account has been deactivated. Please contact administrator.');
    }
    const isMatch = await bcrypt.compare(rawPassword, userRow.password);
    if (!isMatch) return null;

    return new User(userRow);
  }

  // UML Method: logout(): void
  logout() {
    // Session / token invalidated on client side / server log
    return true;
  }

  // UML Method: updateProfile(): void
  async updateProfile({ name, profilePic, password }) {
    const updates = [];
    const params = [];

    if (name) {
      this.name = name;
      updates.push('name = ?');
      params.push(name);
    }
    if (profilePic !== undefined) {
      this.profilePic = profilePic;
      updates.push('profilePic = ?');
      params.push(profilePic);
    }
    if (password) {
      const hashed = bcrypt.hashSync(password, 10);
      this.password = hashed;
      updates.push('password = ?');
      params.push(hashed);
    }

    if (updates.length > 0) {
      params.push(this.userId);
      await run(`UPDATE users SET ${updates.join(', ')} WHERE userId = ?`, params);
    }
    return this;
  }

  static async findById(userId) {
    const row = await get('SELECT * FROM users WHERE userId = ?', [userId]);
    return row ? new User(row) : null;
  }

  static async findByEmail(email) {
    const row = await get('SELECT * FROM users WHERE email = ?', [email]);
    return row ? new User(row) : null;
  }
}

module.exports = User;
