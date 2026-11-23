const { get, query, run } = require('../config/db');

class Team {
  constructor({ teamId, teamName, projectTopic, leaderId, createdOn }) {
    this.teamId = teamId;
    this.teamName = teamName;
    this.projectTopic = projectTopic;
    this.leaderId = leaderId;
    this.createdOn = createdOn;
  }

  // UML Method: addMember(studentId): void
  async addMember(studentId) {
    const sid = parseInt(studentId, 10);
    if (!sid || isNaN(sid)) throw new Error('Valid student ID is required.');

    const student = await get('SELECT * FROM students WHERE studentId = ?', [sid]);
    if (!student) throw new Error('Student not found.');

    const inAnyTeam = await get(
      'SELECT t.teamName FROM team_members tm JOIN teams t ON tm.teamId = t.teamId WHERE tm.studentId = ?',
      [sid]
    );
    if (inAnyTeam) {
      throw new Error(`Student is already a member of team "${inAnyTeam.teamName}". A student cannot be in two teams.`);
    }

    const countRow = await get(
      'SELECT COUNT(*) as count FROM team_members WHERE teamId = ?',
      [this.teamId]
    );
    const count = countRow ? countRow.count : 0;
    if (count >= 4) {
      throw new Error('Team already has the maximum of 4 members.');
    }

    await run(
      'INSERT INTO team_members (teamId, studentId) VALUES (?, ?)',
      [this.teamId, sid]
    );

    // Send notification
    const studentUser = await get('SELECT userId FROM students WHERE studentId = ?', [sid]);
    if (studentUser) {
      await run(
        'INSERT INTO notifications (userId, message, link) VALUES (?, ?, ?)',
        [studentUser.userId, `You have been added to team "${this.teamName}".`, '/team']
      );
    }
    return true;
  }

  // UML Method: removeMember(studentId): void
  async removeMember(studentId) {
    const sid = parseInt(studentId, 10);
    if (!sid || isNaN(sid)) throw new Error('Valid student ID is required.');

    // Check if the student is a member of this team
    const isMember = await get(
      'SELECT * FROM team_members WHERE teamId = ? AND studentId = ?',
      [this.teamId, sid]
    );
    if (!isMember) {
      throw new Error('Student is not a member of this team.');
    }

    // Multiplicity check: A team must have at least 1 member (Student 0..* - 1..* Team)
    const members = await query('SELECT * FROM team_members WHERE teamId = ?', [this.teamId]);
    if (members.length <= 1) {
      throw new Error('A team must have at least 1 member. Team cannot be left empty.');
    }

    // Check if removing the leader
    if (Number(this.leaderId) === sid) {
      throw new Error('The team leader cannot remove themselves.');
    }

    const removed = await run(
      'DELETE FROM team_members WHERE teamId = ? AND studentId = ?',
      [this.teamId, sid]
    );

    // Unassign tasks assigned to this student in this team's project
    let unassignedCount = 0;
    const project = await get('SELECT projectId FROM projects WHERE teamId = ?', [this.teamId]);
    if (project) {
      const taskRes = await run(
        'UPDATE tasks SET assignedTo = NULL WHERE projectId = ? AND assignedTo = ?',
        [project.projectId, sid]
      );
      unassignedCount = taskRes.changes;
    }

    // Notify removed student
    const studentUser = await get('SELECT userId FROM students WHERE studentId = ?', [sid]);
    if (studentUser) {
      await run(
        'INSERT INTO notifications (userId, message, link) VALUES (?, ?, ?)',
        [studentUser.userId, `You have been removed from team "${this.teamName}".`, '/teams/search']
      );
    }

    // If removed member had tasks assigned, notify the leader
    if (unassignedCount > 0) {
      const leaderUser = await get('SELECT userId FROM students WHERE studentId = ?', [this.leaderId]);
      if (leaderUser) {
        await run(
          'INSERT INTO notifications (userId, message, link) VALUES (?, ?, ?)',
          [leaderUser.userId, `${unassignedCount} task(s) previously assigned to the removed member were set back to Unassigned.`, '/tasks']
        );
      }
    }

    return removed.changes > 0;
  }

  // UML Method: viewTeam(): void
  async viewTeam() {
    const leader = await get(
      `SELECT s.studentId, u.name, u.email, u.profilePic, s.department, s.semester, s.cgpa
       FROM students s
       JOIN users u ON s.userId = u.userId
       WHERE s.studentId = ?`,
      [this.leaderId]
    );

    const members = await this.getMembers();
    const project = await get(
      `SELECT p.*, f.department as facultyDept, f.designation as facultyDesignation, u.name as facultyName
       FROM projects p
       LEFT JOIN faculty f ON p.facultyId = f.facultyId
       LEFT JOIN users u ON f.userId = u.userId
       WHERE p.teamId = ?`,
      [this.teamId]
    );

    return {
      teamId: this.teamId,
      teamName: this.teamName,
      projectTopic: this.projectTopic,
      createdOn: this.createdOn,
      leader,
      members,
      project
    };
  }

  // UML Method: getMembers(): List<Student>
  async getMembers() {
    const rows = await query(
      `SELECT s.studentId, s.userId, s.semester, s.department, s.cgpa,
              u.name, u.email, u.profilePic,
              CASE WHEN s.studentId = ? THEN 1 ELSE 0 END as isLeader
       FROM team_members tm
       JOIN students s ON tm.studentId = s.studentId
       JOIN users u ON s.userId = u.userId
       WHERE tm.teamId = ?
       ORDER BY isLeader DESC, u.name ASC`,
      [this.leaderId, this.teamId]
    );
    return rows.map((m) => ({ ...m, isLeader: Boolean(m.isLeader) }));
  }

  static async findById(teamId) {
    const row = await get('SELECT * FROM teams WHERE teamId = ?', [teamId]);
    return row ? new Team(row) : null;
  }
}

module.exports = Team;
