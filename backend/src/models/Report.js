const { get, query, run } = require('../config/db');

class Report {
  constructor({ reportId, adminId, reportType, summaryData, generatedOn }) {
    this.reportId = reportId;
    this.adminId = adminId;
    this.reportType = reportType;
    this.summaryData = typeof summaryData === 'string' ? JSON.parse(summaryData) : summaryData;
    this.generatedOn = generatedOn;
  }

  // UML Method: generate(): void
  static async generate(adminId, reportType = 'System Performance & Team Status') {
    const totalUsersRow = await get('SELECT COUNT(*) as count FROM users');
    const totalStudentsRow = await get('SELECT COUNT(*) as count FROM students');
    const totalFacultyRow = await get('SELECT COUNT(*) as count FROM faculty');
    const totalTeamsRow = await get('SELECT COUNT(*) as count FROM teams');
    const totalProjectsRow = await get('SELECT COUNT(*) as count FROM projects');
    const projectBreakdown = await query('SELECT status, COUNT(*) as count FROM projects GROUP BY status');
    const taskBreakdown = await query('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');

    const totalUsers = totalUsersRow ? totalUsersRow.count : 0;
    const totalStudents = totalStudentsRow ? totalStudentsRow.count : 0;
    const totalFaculty = totalFacultyRow ? totalFacultyRow.count : 0;
    const totalTeams = totalTeamsRow ? totalTeamsRow.count : 0;
    const totalProjects = totalProjectsRow ? totalProjectsRow.count : 0;

    const teamDetails = await query(
      `SELECT t.teamId, t.teamName, t.projectTopic, u.name as leaderName,
              p.title as projectTitle, p.status as projectStatus,
              (SELECT COUNT(*) FROM team_members tm WHERE tm.teamId = t.teamId) as memberCount,
              (SELECT COUNT(*) FROM tasks tk WHERE tk.projectId = p.projectId) as taskCount,
              (SELECT COUNT(*) FROM tasks tk WHERE tk.projectId = p.projectId AND tk.status = 'Completed') as completedTasks
       FROM teams t
       JOIN students s ON t.leaderId = s.studentId
       JOIN users u ON s.userId = u.userId
       LEFT JOIN projects p ON p.teamId = t.teamId`
    );

    const facultyWorkload = await query(
      `SELECT f.facultyId, fu.name as facultyName, f.department, f.designation,
              COUNT(p.projectId) as assignedProjects,
              (SELECT COUNT(*) FROM feedback fb WHERE fb.facultyId = f.facultyId) as feedbackGiven
       FROM faculty f
       JOIN users fu ON f.userId = fu.userId
       LEFT JOIN projects p ON f.facultyId = p.facultyId
       GROUP BY f.facultyId, fu.name, f.department, f.designation`
    );

    const data = {
      reportType,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalTeams,
        totalProjects,
        projectBreakdown,
        taskBreakdown
      },
      teamDetails,
      facultyWorkload
    };

    const result = await run(
      'INSERT INTO reports (adminId, reportType, summaryData) VALUES (?, ?, ?)',
      [adminId, reportType, JSON.stringify(data)]
    );

    return new Report({
      reportId: Number(result.lastInsertRowid),
      adminId,
      reportType,
      summaryData: data,
      generatedOn: new Date().toISOString()
    });
  }

  // UML Method: viewReport(): void
  viewReport() {
    return {
      reportId: this.reportId,
      adminId: this.adminId,
      reportType: this.reportType,
      summaryData: this.summaryData,
      generatedOn: this.generatedOn
    };
  }

  static async getAll() {
    const rows = await query(
      `SELECT r.*, u.name as adminName
       FROM reports r
       JOIN admins a ON r.adminId = a.adminId
       JOIN users u ON a.userId = u.userId
       ORDER BY r.generatedOn DESC`
    );
    return rows.map((r) => new Report(r));
  }

  static async findById(reportId) {
    const row = await get('SELECT * FROM reports WHERE reportId = ?', [reportId]);
    return row ? new Report(row) : null;
  }
}

module.exports = Report;
