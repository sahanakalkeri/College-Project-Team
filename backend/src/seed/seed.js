require('dotenv').config();
const { exec, isPostgres } = require('../config/db');
const { initializeDatabase } = require('../config/initDb');

async function seed() {
  console.log('--- Starting Database Seeding (Admin & Faculty Only) ---');

  const tables = [
    'feedback',
    'tasks',
    'projects',
    'team_members',
    'teams',
    'reports',
    'notifications',
    'registrations',
    'students',
    'faculty',
    'admins',
    'users'
  ];

  if (isPostgres) {
    // Drop all tables with CASCADE for PostgreSQL
    for (const t of tables) {
      await exec(`DROP TABLE IF EXISTS ${t} CASCADE;`);
    }
  } else {
    // Drop all tables cleanly for SQLite
    await exec('PRAGMA foreign_keys = OFF;');
    for (const t of tables) {
      await exec(`DROP TABLE IF EXISTS ${t};`);
    }
    await exec('PRAGMA foreign_keys = ON;');
  }

  // Initialize DB schema and auto-seed admin and faculty accounts
  await initializeDatabase();

  console.log('=== Database Seeding Completed Successfully! ===');
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
