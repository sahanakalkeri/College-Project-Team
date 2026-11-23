const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const { get, run } = require('../config/db');

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    let extra = {};
    if (user.role === 'Student') {
      const s = await Student.findByUserId(user.userId);
      if (s) {
        extra = {
          studentId: s.studentId,
          semester: s.semester,
          department: s.department,
          cgpa: s.cgpa
        };
      }
    } else if (user.role === 'Faculty') {
      const f = await Faculty.findByUserId(user.userId);
      if (f) {
        extra = {
          facultyId: f.facultyId,
          department: f.department,
          designation: f.designation
        };
      }
    } else if (user.role === 'Admin') {
      const a = await Admin.findByUserId(user.userId);
      if (a) {
        extra = {
          adminId: a.adminId,
          department: a.department
        };
      }
    }

    res.json({
      success: true,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        isActive: user.isActive,
        ...extra
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { name, semester, department, cgpa, designation } = req.body;
    let profilePicUrl = undefined;

    if (req.file) {
      profilePicUrl = `/uploads/${req.file.filename}`;
    }

    await user.updateProfile({
      name,
      profilePic: profilePicUrl
    });

    // Update role specific attributes if provided
    if (user.role === 'Student') {
      const sUpdates = [];
      const sParams = [];
      if (semester) {
        sUpdates.push('semester = ?');
        sParams.push(parseInt(semester, 10));
      }
      if (department) {
        sUpdates.push('department = ?');
        sParams.push(department.trim());
      }
      if (cgpa !== undefined && cgpa !== '') {
        sUpdates.push('cgpa = ?');
        sParams.push(parseFloat(cgpa));
      }
      if (sUpdates.length > 0) {
        sParams.push(user.userId);
        await run(`UPDATE students SET ${sUpdates.join(', ')} WHERE userId = ?`, sParams);
      }
    } else if (user.role === 'Faculty') {
      const fUpdates = [];
      const fParams = [];
      if (department) {
        fUpdates.push('department = ?');
        fParams.push(department.trim());
      }
      if (designation) {
        fUpdates.push('designation = ?');
        fParams.push(designation.trim());
      }
      if (fUpdates.length > 0) {
        fParams.push(user.userId);
        await run(`UPDATE faculty SET ${fUpdates.join(', ')} WHERE userId = ?`, fParams);
      }
    }

    const updatedUser = await User.findById(user.userId);

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      data: {
        userId: updatedUser.userId,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePic: updatedUser.profilePic
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * Dedicated Change Password endpoint for all roles
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current password, new password, and confirmation.' });
    }

    const userRow = await get('SELECT password FROM users WHERE userId = ?', [req.user.userId]);
    if (!userRow) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, userRow.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!strongRegex.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'New password must contain at least one uppercase letter, one lowercase letter, and one number.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await run('UPDATE users SET password = ? WHERE userId = ?', [hashed, req.user.userId]);

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};
