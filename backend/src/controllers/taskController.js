const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');
const Notification = require('../models/Notification');
const { get, query, run } = require('../config/db');

async function createTask(req, res) {
  try {
    const { projectId, title, description, priority, dueDate, assignedTo } = req.body;
    if (!projectId || !title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Project ID and title are required.' });
    }

    const pid = parseInt(projectId, 10);
    const project = await Project.findById(pid);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const team = await Team.findById(project.teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });

    // Only the TeamLeader can create tasks (403 otherwise)
    if (Number(team.leaderId) !== Number(req.user.studentId)) {
      return res.status(403).json({ success: false, message: 'Only the Team Leader can assign tasks.' });
    }

    // Assignee must be a member of the same team
    const assigneeId = assignedTo ? parseInt(assignedTo, 10) : null;
    if (assigneeId) {
      const isMember = await get(
        'SELECT 1 FROM team_members WHERE teamId = ? AND studentId = ?',
        [team.teamId, assigneeId]
      );
      if (!isMember) {
        return res.status(400).json({ success: false, message: 'The assignee must be a member of this team.' });
      }
    }

    const taskId = await Task.assignTask({
      projectId: pid,
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      assignedTo: assigneeId
    });

    // Notify assigned student
    if (assigneeId) {
      const studentUser = await get('SELECT userId FROM students WHERE studentId = ?', [assigneeId]);
      if (studentUser) {
        await Notification.sendNotification(
          studentUser.userId,
          `You have been assigned project part: "${title.trim()}" (Priority: ${priority || 'Medium'}) in team "${team.teamName}".`,
          '/tasks'
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Task created and assigned successfully.',
      data: { taskId }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function updateTaskStatus(req, res) {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = await Project.findById(task.projectId);
    const team = await Team.findById(project.teamId);

    const isLeader = Number(team.leaderId) === Number(req.user.studentId);

    // Members can change status of their OWN tasks only
    if (req.user.role === 'Student' && !isLeader) {
      if (Number(task.assignedTo) !== Number(req.user.studentId)) {
        return res.status(403).json({ success: false, message: 'Members can only change the status of their own assigned tasks.' });
      }
    }

    await task.updateStatus(status);

    // Notify leader when a member updates their status
    if (!isLeader) {
      const leaderStudent = await get('SELECT userId FROM students WHERE studentId = ?', [team.leaderId]);
      if (leaderStudent) {
        await Notification.sendNotification(
          leaderStudent.userId,
          `Team member ${req.user.name} updated status of "${task.title}" to ${status}.`,
          '/tasks'
        );
      }
    }

    res.json({
      success: true,
      message: `Task status updated to ${status}.`,
      data: task
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function updateTask(req, res) {
  try {
    const { taskId } = req.params;
    const { title, description, priority, dueDate, assignedTo, status } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = await Project.findById(task.projectId);
    const team = await Team.findById(project.teamId);

    // Only TeamLeader can edit or reassign tasks
    if (Number(team.leaderId) !== Number(req.user.studentId)) {
      return res.status(403).json({ success: false, message: 'Only the Team Leader can edit or reassign tasks.' });
    }

    // Assignee must be a member of the same team if provided
    let newAssigneeId = undefined;
    if (assignedTo !== undefined) {
      newAssigneeId = (assignedTo !== null && assignedTo !== '') ? parseInt(assignedTo, 10) : null;
      if (newAssigneeId) {
        const isMember = await get(
          'SELECT 1 FROM team_members WHERE teamId = ? AND studentId = ?',
          [team.teamId, newAssigneeId]
        );
        if (!isMember) {
          return res.status(400).json({ success: false, message: 'The assignee must be a member of this team.' });
        }
      }
    }

    const updates = [];
    const params = [];

    if (title && title.trim()) {
      updates.push('title = ?');
      params.push(title.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description ? description.trim() : '');
    }
    if (priority) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (dueDate !== undefined) {
      updates.push('dueDate = ?');
      params.push(dueDate || null);
    }
    if (assignedTo !== undefined) {
      updates.push('assignedTo = ?');
      params.push(newAssigneeId);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length > 0) {
      params.push(taskId);
      await run(`UPDATE tasks SET ${updates.join(', ')} WHERE taskId = ?`, params);
    }

    // Send notification to member when assigned or reassigned
    if (newAssigneeId && newAssigneeId !== task.assignedTo) {
      const newAssigneeUser = await get('SELECT userId FROM students WHERE studentId = ?', [newAssigneeId]);
      if (newAssigneeUser) {
        await Notification.sendNotification(
          newAssigneeUser.userId,
          `Project part "${title || task.title}" has been reassigned to you in team "${team.teamName}".`,
          '/tasks'
        );
      }
    }

    res.json({ success: true, message: 'Task updated successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function deleteTask(req, res) {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = await Project.findById(task.projectId);
    const team = await Team.findById(project.teamId);

    // Only TeamLeader can delete tasks
    if (Number(team.leaderId) !== Number(req.user.studentId)) {
      return res.status(403).json({ success: false, message: 'Only the Team Leader can delete tasks.' });
    }

    await run('DELETE FROM tasks WHERE taskId = ?', [taskId]);
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getProjectTasks(req, res) {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const team = await Team.findById(project.teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });
    const isLeader = Number(team.leaderId) === Number(req.user.studentId);

    let tasksQuery = `SELECT t.*, u.name as assignedToName, u.email as assignedToEmail, u.profilePic as assignedToPic
       FROM tasks t
       LEFT JOIN students s ON t.assignedTo = s.studentId
       LEFT JOIN users u ON s.userId = u.userId
       WHERE t.projectId = ?`;
    const queryParams = [projectId];

    // Members see only their own assigned parts
    if (req.user.role === 'Student' && !isLeader) {
      tasksQuery += ' AND t.assignedTo = ?';
      queryParams.push(req.user.studentId);
    }

    tasksQuery += ` ORDER BY CASE t.status 
         WHEN 'Pending' THEN 1 
         WHEN 'In Progress' THEN 2 
         WHEN 'Completed' THEN 3 
       END, t.dueDate ASC`;

    const tasks = await query(tasksQuery, queryParams);
    const progress = await Task.trackProgress(projectId);

    res.json({
      success: true,
      data: {
        tasks,
        progress,
        isLeader
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getMyTasks(req, res) {
  try {
    if (req.user.role !== 'Student') {
      return res.json({ success: true, data: [] });
    }

    const tasks = await query(
      `SELECT t.*, p.title as projectTitle, team.teamName
       FROM tasks t
       JOIN projects p ON t.projectId = p.projectId
       JOIN teams team ON p.teamId = team.teamId
       WHERE t.assignedTo = ?
       ORDER BY t.dueDate ASC`,
      [req.user.studentId]
    );

    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getProjectTasks,
  getMyTasks
};
