const bcrypt = require('bcryptjs');
const { exec, get, run, transaction, isPostgres } = require('./db');

async function seedAdminAndFaculty() {
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const faculty1PasswordHash = await bcrypt.hash('Faculty@123', 10);
  const faculty2PasswordHash = await bcrypt.hash('Faculty@456', 10);

  await transaction(async () => {
    // 1. Seed Administrator
    const adminUser = await run(
      'INSERT INTO users (name, email, password, role, isActive) VALUES (?, ?, ?, ?, ?)',
      ['Administrator', 'admin@college.edu', adminPasswordHash, 'Admin', 1]
    );
    const adminUserId = Number(adminUser.lastInsertRowid);
    await run(
      'INSERT INTO admins (userId, department) VALUES (?, ?)',
      [adminUserId, 'Administration']
    );

    // 2. Seed Faculty 1
    const f1User = await run(
      'INSERT INTO users (name, email, password, role, isActive) VALUES (?, ?, ?, ?, ?)',
      ['Dr. Robert Vance', 'faculty1@college.edu', faculty1PasswordHash, 'Faculty', 1]
    );
    const f1UserId = Number(f1User.lastInsertRowid);
    await run(
      'INSERT INTO faculty (userId, department, designation) VALUES (?, ?, ?)',
      [f1UserId, 'CSE', 'Professor']
    );

    // 3. Seed Faculty 2
    const f2User = await run(
      'INSERT INTO users (name, email, password, role, isActive) VALUES (?, ?, ?, ?, ?)',
      ['Dr. Sarah Connor', 'faculty2@college.edu', faculty2PasswordHash, 'Faculty', 1]
    );
    const f2UserId = Number(f2User.lastInsertRowid);
    await run(
      'INSERT INTO faculty (userId, department, designation) VALUES (?, ?, ?)',
      [f2UserId, 'CSE', 'Assistant Professor']
    );

    console.log('Seeded 1 Admin and 2 Faculty accounts.');
    console.log('Zero student accounts, zero teams, zero projects seeded (per strict requirements).');
  });
}

async function initializeDatabase() {
  const pkType = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const timestampType = isPostgres ? 'TIMESTAMP' : 'DATETIME';

  const schema = `
    -- 1. Users Table (Base class)
    CREATE TABLE IF NOT EXISTS users (
      userId ${pkType},
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Student', 'Faculty', 'Admin')),
      profilePic TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt ${timestampType} DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Registrations Table
    CREATE TABLE IF NOT EXISTS registrations (
      registrationId ${pkType},
      userId INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      registrationDate ${timestampType} DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE SET NULL
    );

    -- 3. Student Table (extends User)
    CREATE TABLE IF NOT EXISTS students (
      studentId ${pkType},
      userId INTEGER UNIQUE NOT NULL,
      semester INTEGER NOT NULL,
      department TEXT NOT NULL,
      cgpa REAL NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    );

    -- 4. Faculty Table (extends User)
    CREATE TABLE IF NOT EXISTS faculty (
      facultyId ${pkType},
      userId INTEGER UNIQUE NOT NULL,
      department TEXT NOT NULL,
      designation TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    );

    -- 5. Admin Table (extends User)
    CREATE TABLE IF NOT EXISTS admins (
      adminId ${pkType},
      userId INTEGER UNIQUE NOT NULL,
      department TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    );

    -- 6. Team Table
    CREATE TABLE IF NOT EXISTS teams (
      teamId ${pkType},
      teamName TEXT UNIQUE NOT NULL,
      projectTopic TEXT,
      leaderId INTEGER NOT NULL,
      createdOn ${timestampType} DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (leaderId) REFERENCES students(studentId) ON DELETE RESTRICT
    );

    -- 7. Team Members Table (Student 0..* -- 1..* Team)
    CREATE TABLE IF NOT EXISTS team_members (
      teamId INTEGER NOT NULL,
      studentId INTEGER NOT NULL,
      joinedOn ${timestampType} DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (teamId, studentId),
      FOREIGN KEY (teamId) REFERENCES teams(teamId) ON DELETE CASCADE,
      FOREIGN KEY (studentId) REFERENCES students(studentId) ON DELETE CASCADE
    );

    -- 8. Project Table (Team 1 -- 0..* Project, Faculty 1 -- 0..* Project)
    CREATE TABLE IF NOT EXISTS projects (
      projectId ${pkType},
      teamId INTEGER NOT NULL UNIQUE,
      facultyId INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft', 'Submitted', 'Needs Changes', 'Approved', 'Proposing', 'Submitted for Review', 'In Progress', 'Completed')),
      deadline DATE,
      createdOn ${timestampType} DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teamId) REFERENCES teams(teamId) ON DELETE CASCADE,
      FOREIGN KEY (facultyId) REFERENCES faculty(facultyId) ON DELETE SET NULL
    );

    -- 9. Task Table (Project composition)
    CREATE TABLE IF NOT EXISTS tasks (
      taskId ${pkType},
      projectId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'In Progress', 'Completed')),
      dueDate DATE,
      assignedTo INTEGER,
      createdOn ${timestampType} DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(projectId) ON DELETE CASCADE,
      FOREIGN KEY (assignedTo) REFERENCES students(studentId) ON DELETE SET NULL
    );

    -- 10. Feedback Table
    CREATE TABLE IF NOT EXISTS feedback (
      feedbackId ${pkType},
      projectId INTEGER,
      taskId INTEGER,
      facultyId INTEGER NOT NULL,
      comments TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      date ${timestampType} DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (projectId) REFERENCES projects(projectId) ON DELETE CASCADE,
      FOREIGN KEY (taskId) REFERENCES tasks(taskId) ON DELETE CASCADE,
      FOREIGN KEY (facultyId) REFERENCES faculty(facultyId) ON DELETE CASCADE
    );

    -- 11. Notification Table
    CREATE TABLE IF NOT EXISTS notifications (
      notificationId ${pkType},
      userId INTEGER NOT NULL,
      message TEXT NOT NULL,
      date ${timestampType} DEFAULT CURRENT_TIMESTAMP,
      isRead INTEGER DEFAULT 0,
      link TEXT,
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    );

    -- 12. Report Table
    CREATE TABLE IF NOT EXISTS reports (
      reportId ${pkType},
      adminId INTEGER NOT NULL,
      reportType TEXT NOT NULL,
      summaryData TEXT NOT NULL,
      generatedOn ${timestampType} DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (adminId) REFERENCES admins(adminId) ON DELETE CASCADE
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(teamName);
    CREATE INDEX IF NOT EXISTS idx_projects_team ON projects(teamId);
    CREATE INDEX IF NOT EXISTS idx_projects_faculty ON projects(facultyId);
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(projectId);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignedTo ON tasks(assignedTo);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId, isRead);
    CREATE INDEX IF NOT EXISTS idx_feedback_project ON feedback(projectId);
  `;

  await exec(schema);

  // Check if users table is empty; if so, run automatic seeding
  const userCountRow = await get('SELECT COUNT(*) as count FROM users');
  const userCount = parseInt(userCountRow ? (userCountRow.count || 0) : 0, 10);
  if (userCount === 0) {
    console.log('Database is empty. Automatically running initial seed (Admin & Faculty only)...');
    await seedAdminAndFaculty();
    console.log('Database auto-seeding completed.');
  }
}

module.exports = { initializeDatabase, seedAdminAndFaculty };
