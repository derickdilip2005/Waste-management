const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Mock notifications data (in a real app, this would be in a database)
let notifications = [
  {
    _id: 'notif_1',
    userId: null, // Will be set dynamically
    type: 'report_status',
    title: 'Report Status Updated',
    message: 'Your waste report has been approved and is now being processed.',
    isRead: false,
    actionUrl: '/reports/report_123',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    _id: 'notif_2',
    userId: null,
    type: 'reward',
    title: 'Points Earned!',
    message: 'You earned 25 points for your verified waste report. Keep up the great work!',
    isRead: false,
    actionUrl: '/rewards',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    _id: 'notif_3',
    userId: null,
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM EST.',
    isRead: true,
    actionUrl: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000)
  },
  {
    _id: 'notif_4',
    userId: null,
    type: 'achievement',
    title: 'Achievement Unlocked!',
    message: 'Congratulations! You\'ve submitted 10 waste reports and earned the "Eco Warrior" badge.',
    isRead: false,
    actionUrl: '/profile/achievements',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
  },
  {
    _id: 'notif_5',
    userId: null,
    type: 'reminder',
    title: 'Weekly Report Reminder',
    message: 'Don\'t forget to submit your weekly waste reports to earn more points!',
    isRead: true,
    actionUrl: '/reports/new',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  }
];

// Helper function to create notification
const createNotification = (userId, type, title, message, actionUrl = null) => {
  const notification = {
    _id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    title,
    message,
    isRead: false,
    actionUrl,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  notifications.push(notification);
  return notification;
};

// Helper function to send push notification (mock implementation)
const sendPushNotification = async (userId, notification) => {
  // In a real implementation, you would integrate with:
  // - Firebase Cloud Messaging (FCM)
  // - Apple Push Notification Service (APNs)
  // - Web Push Protocol
  
  console.log(`Push notification sent to user ${userId}:`, {
    title: notification.title,
    message: notification.message
  });
  
  // Mock delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return { success: true, messageId: `msg_${Date.now()}` };
};

// Helper function to send email notification (mock implementation)
const sendEmailNotification = async (userEmail, notification) => {
  // In a real implementation, you would integrate with:
  // - SendGrid
  // - AWS SES
  // - Nodemailer with SMTP
  
  console.log(`Email notification sent to ${userEmail}:`, {
    subject: notification.title,
    body: notification.message
  });
  
  // Mock delay to simulate email sending
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return { success: true, messageId: `email_${Date.now()}` };
};

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Filter notifications for the current user
    let userNotifications = notifications
      .filter(notif => notif.userId === req.user.id || notif.userId === null)
      .map(notif => ({ ...notif, userId: req.user.id })); // Set userId for global notifications
    
    // Filter unread only if requested
    if (unreadOnly === 'true') {
      userNotifications = userNotifications.filter(notif => !notif.isRead);
    }
    
    // Sort by creation date (newest first)
    userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const paginatedNotifications = userNotifications.slice(skip, skip + parseInt(limit));
    
    const totalCount = userNotifications.length;
    const unreadCount = userNotifications.filter(notif => !notif.isRead).length;
    
    res.json({
      success: true,
      notifications: paginatedNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = notifications.find(n => 
      n._id === req.params.id && (n.userId === req.user.id || n.userId === null)
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notification.isRead = true;
    notification.updatedAt = new Date();
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ 
      message: 'Failed to mark notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userNotifications = notifications.filter(n => 
      n.userId === req.user.id || n.userId === null
    );
    
    userNotifications.forEach(notification => {
      notification.isRead = true;
      notification.updatedAt = new Date();
      notification.userId = req.user.id; // Set userId for global notifications
    });
    
    res.json({
      success: true,
      message: `Marked ${userNotifications.length} notifications as read`
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ 
      message: 'Failed to mark all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificationIndex = notifications.findIndex(n => 
      n._id === req.params.id && (n.userId === req.user.id || n.userId === null)
    );
    
    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notifications.splice(notificationIndex, 1);
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      message: 'Failed to delete notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send notification to user (internal API)
router.post('/send', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin or system
    if (req.user.role !== 'admin' && req.user.role !== 'system') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { userId, type, title, message, actionUrl, sendPush = false, sendEmail = false } = req.body;
    
    // Validate required fields
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create notification
    const notification = createNotification(userId, type, title, message, actionUrl);
    
    // Get user for email/push notifications
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const results = { notification };
    
    // Send push notification if requested
    if (sendPush) {
      try {
        const pushResult = await sendPushNotification(userId, notification);
        results.pushNotification = pushResult;
      } catch (error) {
        console.error('Push notification failed:', error);
        results.pushNotification = { success: false, error: error.message };
      }
    }
    
    // Send email notification if requested
    if (sendEmail) {
      try {
        const emailResult = await sendEmailNotification(user.email, notification);
        results.emailNotification = emailResult;
      } catch (error) {
        console.error('Email notification failed:', error);
        results.emailNotification = { success: false, error: error.message };
      }
    }
    
    res.json({
      success: true,
      message: 'Notification sent successfully',
      ...results
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ 
      message: 'Failed to send notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send bulk notifications (admin only)
router.post('/send-bulk', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { 
      userIds, 
      type, 
      title, 
      message, 
      actionUrl, 
      sendPush = false, 
      sendEmail = false,
      userRole = null // Optional: filter by user role
    } = req.body;
    
    // Validate required fields
    if (!type || !title || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    let targetUsers = [];
    
    if (userIds && userIds.length > 0) {
      // Send to specific users
      targetUsers = await User.find({ _id: { $in: userIds } });
    } else if (userRole) {
      // Send to users with specific role
      targetUsers = await User.find({ role: userRole });
    } else {
      // Send to all users
      targetUsers = await User.find({});
    }
    
    if (targetUsers.length === 0) {
      return res.status(400).json({ message: 'No target users found' });
    }
    
    const results = {
      totalUsers: targetUsers.length,
      notifications: [],
      pushNotifications: [],
      emailNotifications: []
    };
    
    // Create notifications for each user
    for (const user of targetUsers) {
      try {
        const notification = createNotification(user._id.toString(), type, title, message, actionUrl);
        results.notifications.push({ userId: user._id, success: true, notificationId: notification._id });
        
        // Send push notification if requested
        if (sendPush) {
          try {
            const pushResult = await sendPushNotification(user._id.toString(), notification);
            results.pushNotifications.push({ userId: user._id, success: true, ...pushResult });
          } catch (error) {
            results.pushNotifications.push({ userId: user._id, success: false, error: error.message });
          }
        }
        
        // Send email notification if requested
        if (sendEmail) {
          try {
            const emailResult = await sendEmailNotification(user.email, notification);
            results.emailNotifications.push({ userId: user._id, success: true, ...emailResult });
          } catch (error) {
            results.emailNotifications.push({ userId: user._id, success: false, error: error.message });
          }
        }
      } catch (error) {
        results.notifications.push({ userId: user._id, success: false, error: error.message });
      }
    }
    
    res.json({
      success: true,
      message: `Bulk notifications sent to ${targetUsers.length} users`,
      results
    });
  } catch (error) {
    console.error('Send bulk notifications error:', error);
    res.status(500).json({ 
      message: 'Failed to send bulk notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Default preferences if not set
    const defaultPreferences = {
      email: {
        reportUpdates: true,
        rewards: true,
        system: true,
        reminders: true
      },
      push: {
        reportUpdates: true,
        rewards: true,
        system: false,
        reminders: true
      }
    };
    
    const preferences = user.notificationPreferences || defaultPreferences;
    
    res.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update notification preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({ message: 'Preferences are required' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.notificationPreferences = preferences;
    await user.save();
    
    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: user.notificationPreferences
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ 
      message: 'Failed to update notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get notification analytics (admin only)
router.get('/admin/analytics', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const stats = {
      totalNotifications: notifications.length,
      unreadNotifications: notifications.filter(n => !n.isRead).length,
      notificationsByType: {
        report_status: notifications.filter(n => n.type === 'report_status').length,
        reward: notifications.filter(n => n.type === 'reward').length,
        system: notifications.filter(n => n.type === 'system').length,
        reminder: notifications.filter(n => n.type === 'reminder').length,
        achievement: notifications.filter(n => n.type === 'achievement').length
      },
      recentNotifications: notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch notification statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;