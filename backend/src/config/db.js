const { Pool, types } = require('pg');
const { AsyncLocalStorage } = require('async_hooks');
const path = require('path');
const fs = require('fs');

// PostgreSQL type parsers for seamless compatibility
// Parse int8 (BIGINT, like COUNT(*)) as integer number
types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)));
// Parse numeric as float
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));
// Parse DATE as string 'YYYY-MM-DD'
types.setTypeParser(1082, (val) => val);
// Parse TIMESTAMP / TIMESTAMPTZ as string
types.setTypeParser(1114, (val) => val);
types.setTypeParser(1184, (val) => val);

const asyncLocalStorage = new AsyncLocalStorage();
const isPostgres = Boolean(process.env.DATABASE_URL);

let pool = null;
let sqliteDb = null;

if (isPostgres) {
  const needsSsl =
    !process.env.DATABASE_URL.includes('localhost') &&
    !process.env.DATABASE_URL.includes('127.0.0.1');

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: needsSsl ? { rejectUnauthorized: false } : false
  });

  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL Pool Error:', err);
  });
} else {
  // Fallback to local SQLite when DATABASE_URL is not configured
  const { DatabaseSync } = require('node:sqlite');
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'database.sqlite');
  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
}

// Mapping from lowercase PostgreSQL identifier to application camelCase property
const COLUMN_MAP = {
  userid: 'userId',
  profilepic: 'profilePic',
  isactive: 'isActive',
  createdat: 'createdAt',
  registrationid: 'registrationId',
  registrationdate: 'registrationDate',
  studentid: 'studentId',
  facultyid: 'facultyId',
  adminid: 'adminId',
  teamid: 'teamId',
  teamname: 'teamName',
  projecttopic: 'projectTopic',
  leaderid: 'leaderId',
  createdon: 'createdOn',
  joinedon: 'joinedOn',
  projectid: 'projectId',
  taskid: 'taskId',
  duedate: 'dueDate',
  assignedto: 'assignedTo',
  feedbackid: 'feedbackId',
  notificationid: 'notificationId',
  isread: 'isRead',
  reportid: 'reportId',
  reporttype: 'reportType',
  summarydata: 'summaryData',
  generatedon: 'generatedOn',
  leadername: 'leaderName',
  leaderemail: 'leaderEmail',
  projecttitle: 'projectTitle',
  projectstatus: 'projectStatus',
  projectdeadline: 'projectDeadline',
  membercount: 'memberCount',
  studentname: 'studentName',
  studentemail: 'studentEmail',
  studentdept: 'studentDept',
  facultydept: 'facultyDept',
  admindept: 'adminDept',
  totalcount: 'totalCount',
  completedcount: 'completedCount',
  completedtaskcount: 'completedTaskCount',
  avgrating: 'avgRating',
  reviewcount: 'reviewCount',
  studentcount: 'studentCount',
  teamcount: 'teamCount',
  projectcount: 'projectCount',
  taskcount: 'taskCount',
  assignedname: 'assignedName',
  assignedemail: 'assignedEmail',
  assignedtoname: 'assignedToName',
  assignedtoemail: 'assignedToEmail',
  assignedtopic: 'assignedToPic',
  facultyname: 'facultyName',
  facultyemail: 'facultyEmail',
  facultydesignation: 'facultyDesignation',
  adminname: 'adminName',
  adminemail: 'adminEmail',
  submissiondate: 'submissionDate',
  taskprogress: 'taskProgress',
  lastactive: 'lastActive',
  completedtasks: 'completedTasks',
  isleader: 'isLeader',
  assignedprojects: 'assignedProjects',
  feedbackgiven: 'feedbackGiven'
};

function mapRow(row) {
  if (!row || typeof row !== 'object') return row;
  const mapped = { ...row };
  for (const [key, val] of Object.entries(row)) {
    const lower = key.toLowerCase();
    const camel = COLUMN_MAP[lower];
    if (camel && camel !== key) {
      mapped[camel] = val;
    }
  }
  return mapped;
}

function convertSqlForPostgres(sql) {
  // Convert SQLite-style ? placeholders to PostgreSQL $1, $2, etc.
  let index = 1;
  let converted = sql.replace(/\?/g, () => `$${index++}`);
  // Replace case-insensitive LIKE with ILIKE for PostgreSQL
  converted = converted.replace(/\bLIKE\b/gi, 'ILIKE');
  return converted;
}

function prepareInsertSql(sql) {
  const converted = convertSqlForPostgres(sql);
  const trimmed = converted.trim().replace(/;+$/, '');
  if (/^INSERT\s+INTO\s+/i.test(trimmed) && !/\bRETURNING\b/i.test(trimmed)) {
    return trimmed + ' RETURNING *';
  }
  return trimmed;
}

function getActiveClient() {
  return asyncLocalStorage.getStore() || pool;
}

/**
 * Run a query that returns multiple rows
 */
async function query(sql, params = []) {
  if (isPostgres) {
    const client = getActiveClient();
    const converted = convertSqlForPostgres(sql);
    const res = await client.query(converted, params);
    return res.rows.map(mapRow);
  } else {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...params);
  }
}

/**
 * Run a query that returns a single row
 */
async function get(sql, params = []) {
  if (isPostgres) {
    const client = getActiveClient();
    const converted = convertSqlForPostgres(sql);
    const res = await client.query(converted, params);
    return res.rows[0] ? mapRow(res.rows[0]) : null;
  } else {
    const stmt = sqliteDb.prepare(sql);
    return stmt.get(...params);
  }
}

/**
 * Run an INSERT / UPDATE / DELETE statement
 */
async function run(sql, params = []) {
  if (isPostgres) {
    const client = getActiveClient();
    const prepared = prepareInsertSql(sql);
    const res = await client.query(prepared, params);
    const firstRow = res.rows[0] ? mapRow(res.rows[0]) : null;

    let lastInsertRowid = null;
    if (firstRow) {
      // Find primary key ending in 'Id' (case-insensitive) or first column
      const idKey = Object.keys(firstRow).find((k) => k.toLowerCase().endsWith('id')) || Object.keys(firstRow)[0];
      lastInsertRowid = firstRow[idKey];
    }

    return {
      lastInsertRowid,
      changes: res.rowCount,
      rows: res.rows.map(mapRow)
    };
  } else {
    const stmt = sqliteDb.prepare(sql);
    return stmt.run(...params);
  }
}

/**
 * Execute raw DDL or queries
 */
async function exec(sql) {
  if (isPostgres) {
    const client = getActiveClient();
    return await client.query(sql);
  } else {
    return sqliteDb.exec(sql);
  }
}

/**
 * Run operations within a transaction
 */
async function transaction(callback) {
  if (isPostgres) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await asyncLocalStorage.run(client, async () => {
        return await callback(client);
      });
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    sqliteDb.exec('BEGIN TRANSACTION');
    try {
      const result = await callback();
      sqliteDb.exec('COMMIT');
      return result;
    } catch (err) {
      sqliteDb.exec('ROLLBACK');
      throw err;
    }
  }
}

const db = {
  exec,
  query,
  get,
  run,
  transaction
};

module.exports = {
  db,
  pool,
  isPostgres,
  query,
  get,
  run,
  exec,
  transaction
};
