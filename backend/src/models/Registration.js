const bcrypt = require('bcryptjs');
const { get, run, transaction } = require('../config/db');
const User = require('./User');

class Registration {
  constructor({ registrationId, userId, name, email, password, role, registrationDate }) {
    this.registrationId = registrationId;
    this.userId = userId;
    this.name = name;
    this.email = email;
    this.password = password;
    // Security constraint: Public registration only allows Student accounts
    this.role = 'Student';
    this.registrationDate = registrationDate || new Date().toISOString();
  }

  // UML Method: validate(): boolean
  async validate(confirmPassword) {
    if (!this.name || this.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email || !emailRegex.test(this.email.trim())) {
      throw new Error('Invalid email format. Please enter a valid email address.');
    }

    // Unique email check with exact clear message
    const existing = await get('SELECT userId FROM users WHERE email = ?', [this.email.toLowerCase().trim()]);
    if (existing) {
      throw new Error('This email is already registered.');
    }

    // Strong password validation: min 8 characters, at least one uppercase, one lowercase, one number
    if (!this.password || this.password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!strongPasswordRegex.test(this.password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
    }

    if (confirmPassword !== undefined && this.password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    return true;
  }

  // UML Method: register(): boolean (Registration «creates» a User)
  async register(extraDetails = {}) {
    const { confirmPassword, semester = 1, department = 'Computer Science', cgpa = 8.0 } = extraDetails;
    await this.validate(confirmPassword);

    const hashedPassword = await bcrypt.hash(this.password, 10);
    const normalizedEmail = this.email.toLowerCase().trim();

    return await transaction(async () => {
      // 1. Create User (Role strictly forced to 'Student')
      const userResult = await run(
        'INSERT INTO users (name, email, password, role, isActive) VALUES (?, ?, ?, ?, 1)',
        [this.name.trim(), normalizedEmail, hashedPassword, 'Student']
      );
      this.userId = Number(userResult.lastInsertRowid);

      // 2. Log Registration audit record (password hashed)
      const regResult = await run(
        'INSERT INTO registrations (userId, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [this.userId, this.name.trim(), normalizedEmail, hashedPassword, 'Student']
      );
      this.registrationId = Number(regResult.lastInsertRowid);

      // 3. Create student profile
      const parsedSemester = parseInt(semester, 10) || 1;
      const parsedCgpa = parseFloat(cgpa) >= 0 ? parseFloat(cgpa) : 8.0;
      const dept = (department && department.trim()) || 'Computer Science';

      await run(
        'INSERT INTO students (userId, semester, department, cgpa) VALUES (?, ?, ?, ?)',
        [this.userId, parsedSemester, dept, parsedCgpa]
      );

      return true;
    });
  }

  // UML Method: getUserDetails(): User
  async getUserDetails() {
    if (!this.userId) return null;
    return await User.findById(this.userId);
  }
}

module.exports = Registration;
