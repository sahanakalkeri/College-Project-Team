const jwt = require('jsonwebtoken');
const Registration = require('../models/Registration');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');
const { get, query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_college_jwt_key_2026_secure';

async function register(req, res) {
  try {
    const { name, email, password, confirmPassword, semester, department, cgpa } = req.body;

    // Security check: Force role to 'Student' on server
    const registration = new Registration({
      name,
      email,
      password,
      role: 'Student'
    });

    await registration.register({ confirmPassword, semester, department, cgpa });

    // Send welcome notification
    await Notification.sendNotification(
      registration.userId,
      `Welcome to College Project Team Portal, ${name}! Start by creating or joining a team.`,
      '/dashboard'
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please log in with your credentials.',
      data: {
        userId: registration.userId,
        email: registration.email,
        role: 'Student'
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.login(email.toLowerCase().trim(), password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Role-specific payload
    let roleDetails = {};
    let isLeader = false;
    let ledTeamIds = [];

    if (user.role === 'Student') {
      const student = await Student.findByUserId(user.userId);
      if (student) {
        roleDetails = {
          studentId: student.studentId,
          semester: student.semester,
          department: student.department,
          cgpa: student.cgpa
        };
        const ledTeams = await query('SELECT teamId FROM teams WHERE leaderId = ?', [student.studentId]);
        isLeader = ledTeams.length > 0;
        ledTeamIds = ledTeams.map((t) => t.teamId);
      }
    } else if (user.role === 'Faculty') {
      const faculty = await Faculty.findByUserId(user.userId);
      if (faculty) {
        roleDetails = {
          facultyId: faculty.facultyId,
          department: faculty.department,
          designation: faculty.designation
        };
      }
    } else if (user.role === 'Admin') {
      const admin = await Admin.findByUserId(user.userId);
      if (admin) {
        roleDetails = {
          adminId: admin.adminId,
          department: admin.department
        };
      }
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePic: user.profilePic,
          isLeader,
          ledTeamIds,
          ...roleDetails
        }
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

function logout(req, res) {
  // Session cleared on client side; endpoint provided per UML logout(): void
  res.json({ success: true, message: 'Logged out successfully.' });
}

function me(req, res) {
  res.json({ success: true, data: req.user });
}

module.exports = { register, login, logout, me };
