const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Admin only routes
router.use(authenticateToken, authorizeRoles('Admin'));

// Manage Users
router.get('/users', adminController.getUsers);
router.post('/users/:userId/action', adminController.manageUserAction);

// Reports
router.post('/reports/generate', adminController.generateReport);
router.get('/reports', adminController.listReports);
router.get('/reports/:reportId', adminController.getReportById);
router.get('/export/csv', adminController.exportCsv);

module.exports = router;
