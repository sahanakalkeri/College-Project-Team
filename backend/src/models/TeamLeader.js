const Student = require('./Student');
const { get, query, run } = require('../config/db');

class TeamLeader extends Student {
  constructor(studentData, teamId) {
    super(studentData);
    this.teamId = teamId;
  }

  // UML Method: addMember(studentId): void
  async addMember(studentId) {
    const Team = require('./Team');
    const team = await Team.findById(this.teamId);
    if (!team) throw new Error('Team not found.');
    return await team.addMember(studentId);
  }

  // UML Method: removeMember(studentId): void
  async removeMember(studentId) {
    const Team = require('./Team');
    const team = await Team.findById(this.teamId);
    if (!team) throw new Error('Team not found.');
    return await team.removeMember(studentId);
  }

  // UML Method: assignTask(): void
  async assignTask(projectId, { title, description, priority = 'Medium', dueDate, assignedTo }) {
    if (!title || title.trim().length === 0) {
      throw new Error('Task title is required.');
    }

    const validPriorities = ['Low', 'Medium', 'High'];
    const p = validPriorities.includes(priority) ? priority : 'Medium';

    // Verify assignedTo is a team member if assigned
    const assigneeId = assignedTo ? parseInt(assignedTo, 10) : null;
    if (assigneeId) {
      const isMember = await get(
        'SELECT * FROM team_members WHERE teamId = ? AND studentId = ?',
        [this.teamId, assigneeId]
      );
      if (!isMember) {
        throw new Error('Assigned student is not a member of this team.');
      }
    }

    const result = await run(
      'INSERT INTO tasks (projectId, title, description, priority, status, dueDate, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [projectId, title.trim(), description || '', p, 'Pending', dueDate || null, assigneeId]
    );

    // Notify assigned student
    if (assigneeId) {
      const studentUser = await get(
        'SELECT s.userId FROM students s WHERE s.studentId = ?',
        [assigneeId]
      );
      if (studentUser) {
        await run(
          'INSERT INTO notifications (userId, message, link) VALUES (?, ?, ?)',
          [
            studentUser.userId,
            `You have been assigned project part: "${title.trim()}" (Priority: ${p}) in this team.`,
            '/tasks'
          ]
        );
      }
    }

    return Number(result.lastInsertRowid);
  }

  // UML Method: trackTaskStatus(): void
  async trackTaskStatus(projectId) {
    const tasks = await query(
      `SELECT t.*, u.name as assignedToName, u.email as assignedToEmail
       FROM tasks t
       LEFT JOIN students s ON t.assignedTo = s.studentId
       LEFT JOIN users u ON s.userId = u.userId
       WHERE t.projectId = ?
       ORDER BY t.dueDate ASC`,
      [projectId]
    );
    return tasks;
  }

  // UML Method: manageTeam(): void
  async manageTeam({ teamName, projectTopic }) {
    const updates = [];
    const params = [];
    if (teamName) {
      updates.push('teamName = ?');
      params.push(teamName.trim());
    }
    if (projectTopic) {
      updates.push('projectTopic = ?');
      params.push(projectTopic.trim());
    }
    if (updates.length > 0) {
      params.push(this.teamId);
      await run(`UPDATE teams SET ${updates.join(', ')} WHERE teamId = ?`, params);
    }
    return true;
  }

  static async fromStudentAndTeam(student, teamId) {
    const isLeader = await get(
      'SELECT * FROM teams WHERE teamId = ? AND leaderId = ?',
      [teamId, student.studentId]
    );
    if (!isLeader) {
      throw new Error('Student is not the leader of this team.');
    }
    return new TeamLeader(student, teamId);
  }
}

module.exports = TeamLeader;
