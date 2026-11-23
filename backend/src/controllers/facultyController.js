const Faculty = require('../models/Faculty');
const Feedback = require('../models/Feedback');
const Project = require('../models/Project');
const { get, query } = require('../config/db');

async function getFacultyTeams(req, res) {
  try {
    const faculty = await Faculty.findByUserId(req.user.userId);
    if (!faculty) {
      return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
    }

    const teams = await faculty.viewTeams();
    res.json({ success: true, data: teams });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getProjectDetails(req, res) {
  try {
    const faculty = await Faculty.findByUserId(req.user.userId);
    if (!faculty) {
      return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
    }

    const { projectId } = req.params;
    const details = await faculty.viewProjectDetails(projectId);
    res.json({ success: true, data: details });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getProjectTaskProgress(req, res) {
  try {
    const faculty = await Faculty.findByUserId(req.user.userId);
    if (!faculty) {
      return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
    }

    const { projectId } = req.params;
    const progress = await faculty.viewTaskProgress(projectId);
    res.json({ success: true, data: progress });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function submitProjectFeedback(req, res) {
  try {
    const faculty = await Faculty.findByUserId(req.user.userId);
    if (!faculty) {
      return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
    }

    const { projectId } = req.params;
    const { comments, rating, taskId, statusUpdate } = req.body;

    const feedbackId = await faculty.provideFeedback(projectId, {
      comments,
      rating,
      taskId: taskId || null,
      newStatus: statusUpdate || null
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully!',
      data: { feedbackId, newStatus: statusUpdate }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getFacultyTeams,
  getProjectDetails,
  getProjectTaskProgress,
  submitProjectFeedback
};
