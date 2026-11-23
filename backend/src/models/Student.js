const User = require('./User');
const { get, query, run, transaction } = require('../config/db');

class Student extends User {
  constructor({ userId, name, email, password, role, profilePic, isActive, studentId, semester, department, cgpa }) {
    super({ userId, name, email, password, role, profilePic, isActive });
    this.studentId = studentId;
    this.semester = semester;
    this.department = department;
    this.cgpa = cgpa;
  }

  // UML Method: createTeam(): void
  async createTeam(teamName, projectTopic = null) {
    if (!teamName || teamName.trim().length < 3) {
      throw new Error('Team name must be at least 3 characters long.');
    }

    return await transaction(async () => {
      // Create team with this student as leader
      const teamResult = await run(
        'INSERT INTO teams (teamName, projectTopic, leaderId) VALUES (?, ?, ?)',
        [teamName.trim(), projectTopic ? projectTopic.trim() : null, this.studentId]
      );
      const teamId = Number(teamResult.lastInsertRowid);

      // Add student to team_members
      await run(
        'INSERT INTO team_members (teamId, studentId) VALUES (?, ?)',
        [teamId, this.studentId]
      );

      // Auto-initialize Project associated with this team
      await run(
        'INSERT INTO projects (teamId, title, description, status) VALUES (?, ?, ?, ?)',
        [
          teamId,
          projectTopic ? projectTopic.trim() : `${teamName.trim()} Project`,
          'Initial project setup pending detailed description and faculty review.',
          'Draft'
        ]
      );

      return teamId;
    });
  }

  // UML Method: searchTeams(): List<Team>
  static async searchTeams(keyword = '') {
    const search = `%${keyword.trim()}%`;
    const rows = await query(
      `SELECT t.*, u.name as leaderName, u.email as leaderEmail,
              p.projectId, p.status as projectStatus, p.facultyId,
              (SELECT COUNT(*) FROM team_members tm WHERE tm.teamId = t.teamId) as memberCount
       FROM teams t
       JOIN students s ON t.leaderId = s.studentId
       JOIN users u ON s.userId = u.userId
       LEFT JOIN projects p ON p.teamId = t.teamId
       WHERE t.teamName LIKE ? OR t.projectTopic LIKE ?
       ORDER BY t.createdOn DESC`,
      [search, search]
    );
    return rows;
  }

  // UML Method: joinTeam(): void
  async joinTeam(teamId) {
    const team = await get('SELECT * FROM teams WHERE teamId = ?', [teamId]);
    if (!team) throw new Error('Team does not exist.');

    const alreadyMember = await get(
      'SELECT * FROM team_members WHERE teamId = ? AND studentId = ?',
      [teamId, this.studentId]
    );
    if (alreadyMember) throw new Error('You are already a member of this team.');

    // Limit team size e.g. 4 members max
    const memberCountRow = await get(
      'SELECT COUNT(*) as cnt FROM team_members WHERE teamId = ?',
      [teamId]
    );
    const memberCount = memberCountRow ? memberCountRow.cnt : 0;
    if (memberCount >= 4) {
      throw new Error('This team has reached the maximum capacity of 4 members.');
    }

    await run(
      'INSERT INTO team_members (teamId, studentId) VALUES (?, ?)',
      [teamId, this.studentId]
    );

    // Notify leader
    const leaderUser = await get(
      'SELECT s.userId FROM students s WHERE s.studentId = ?',
      [team.leaderId]
    );
    if (leaderUser) {
      await run(
        'INSERT INTO notifications (userId, message, link) VALUES (?, ?, ?)',
        [
          leaderUser.userId,
          `${this.name} has joined your team "${team.teamName}".`,
          '/team'
        ]
      );
    }
    return true;
  }

  // UML Method: selectProjectTopic(): void
  async selectProjectTopic(teamId, topic, description = '') {
    const isMember = await get(
      'SELECT * FROM team_members WHERE teamId = ? AND studentId = ?',
      [teamId, this.studentId]
    );
    if (!isMember) throw new Error('You are not a member of this team.');

    return await transaction(async () => {
      await run('UPDATE teams SET projectTopic = ? WHERE teamId = ?', [topic.trim(), teamId]);
      await run(
        'UPDATE projects SET title = ?, description = COALESCE(?, description) WHERE teamId = ?',
        [topic.trim(), description.trim() || null, teamId]
      );
      return true;
    });
  }

  // UML Method: viewProfile(): void
  viewProfile() {
    return {
      userId: this.userId,
      studentId: this.studentId,
      name: this.name,
      email: this.email,
      role: this.role,
      profilePic: this.profilePic,
      semester: this.semester,
      department: this.department,
      cgpa: this.cgpa
    };
  }

  static async findByUserId(userId) {
    const row = await get(
      `SELECT u.*, s.studentId, s.semester, s.department, s.cgpa
       FROM users u
       JOIN students s ON u.userId = s.userId
       WHERE u.userId = ?`,
      [userId]
    );
    return row ? new Student(row) : null;
  }

  static async findByStudentId(studentId) {
    const row = await get(
      `SELECT u.*, s.studentId, s.semester, s.department, s.cgpa
       FROM users u
       JOIN students s ON u.userId = s.userId
       WHERE s.studentId = ?`,
      [studentId]
    );
    return row ? new Student(row) : null;
  }
}

module.exports = Student;
