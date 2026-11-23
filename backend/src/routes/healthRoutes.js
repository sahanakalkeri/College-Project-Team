const express = require('express');
const router = express.Router();
const { get } = require('../config/db');

router.get('/health', async (req, res) => {
  try {
    const dbCheck = await get('SELECT 1 as alive');
    res.json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbCheck && Number(dbCheck.alive) === 1 ? 'Connected' : 'Error',
      service: 'College Project Management System API'
    });
  } catch (err) {
    res.status(503).json({
      status: 'DOWN',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
