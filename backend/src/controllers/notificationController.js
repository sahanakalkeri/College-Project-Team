const Notification = require('../models/Notification');

async function getMyNotifications(req, res) {
  try {
    const notifications = await Notification.getForUser(req.user.userId);
    const unreadCount = await Notification.getUnreadCount(req.user.userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (notification.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    await notification.markAsRead();
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function markAllAsRead(req, res) {
  try {
    await Notification.markAllAsReadForUser(req.user.userId);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead
};
