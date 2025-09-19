const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const { Reward, Redemption } = require('../models/Reward');
const { 
  authenticateToken, 
  requireAdmin, 
  requireCitizen,
  requireOwnershipOrAdmin 
} = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin only)
router.get('/', authenticateToken, requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['citizen', 'admin', 'collector']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    let filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Failed to get users',
      error: 'GET_USERS_ERROR'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or own profile)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check access permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Failed to get user',
      error: 'GET_USER_ERROR'
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { isActive, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user._id.toString() === user._id.toString() && !isActive) {
      return res.status(400).json({
        message: 'You cannot deactivate your own account',
        error: 'CANNOT_DEACTIVATE_SELF'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      message: 'Failed to update user status',
      error: 'UPDATE_STATUS_ERROR'
    });
  }
});

// @route   GET /api/users/:id/points
// @desc    Get user points and transaction history
// @access  Private (Citizens only, own profile or admin)
router.get('/:id/points', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check access permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    if (user.role !== 'citizen') {
      return res.status(400).json({
        message: 'Points are only available for citizens',
        error: 'INVALID_USER_ROLE'
      });
    }

    // Get redemption history
    const redemptions = await Redemption.find({ user: user._id })
      .populate('reward', 'title pointsCost type')
      .sort({ redeemedAt: -1 })
      .limit(20);

    res.json({
      currentPoints: user.points,
      totalReports: user.totalReports,
      completedReports: user.completedReports,
      redemptions
    });

  } catch (error) {
    console.error('Get user points error:', error);
    res.status(500).json({
      message: 'Failed to get user points',
      error: 'GET_POINTS_ERROR'
    });
  }
});

// @route   GET /api/users/rewards/available
// @desc    Get available rewards for redemption
// @access  Private (Citizens only)
router.get('/rewards/available', authenticateToken, requireCitizen, async (req, res) => {
  try {
    const rewards = await Reward.getAvailable();

    // Add affordability information
    const rewardsWithAffordability = rewards.map(reward => ({
      ...reward.toObject(),
      canAfford: req.user.points >= reward.pointsCost
    }));

    res.json({
      rewards: rewardsWithAffordability,
      userPoints: req.user.points
    });

  } catch (error) {
    console.error('Get available rewards error:', error);
    res.status(500).json({
      message: 'Failed to get available rewards',
      error: 'GET_REWARDS_ERROR'
    });
  }
});

// @route   POST /api/users/rewards/:rewardId/redeem
// @desc    Redeem a reward
// @access  Private (Citizens only)
router.post('/rewards/:rewardId/redeem', authenticateToken, requireCitizen, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.rewardId);

    if (!reward) {
      return res.status(404).json({
        message: 'Reward not found',
        error: 'REWARD_NOT_FOUND'
      });
    }

    if (!reward.isAvailable()) {
      return res.status(400).json({
        message: 'Reward is not available for redemption',
        error: 'REWARD_NOT_AVAILABLE'
      });
    }

    if (req.user.points < reward.pointsCost) {
      return res.status(400).json({
        message: 'Insufficient points',
        error: 'INSUFFICIENT_POINTS',
        required: reward.pointsCost,
        available: req.user.points
      });
    }

    // Deduct points from user
    await req.user.deductPoints(reward.pointsCost);

    // Redeem reward
    const redemption = await reward.redeem(req.user._id);

    await redemption.populate('reward', 'title description type partner');

    res.json({
      message: 'Reward redeemed successfully',
      redemption,
      remainingPoints: req.user.points - reward.pointsCost
    });

  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({
      message: 'Failed to redeem reward',
      error: 'REDEEM_ERROR'
    });
  }
});

// @route   GET /api/users/rewards/my-redemptions
// @desc    Get user's redemption history
// @access  Private (Citizens only)
router.get('/rewards/my-redemptions', authenticateToken, requireCitizen, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['active', 'used', 'expired', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const redemptions = await Redemption.find(filter)
      .populate('reward', 'title description type partner pointsCost')
      .sort({ redeemedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Redemption.countDocuments(filter);

    res.json({
      redemptions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get redemptions error:', error);
    res.status(500).json({
      message: 'Failed to get redemptions',
      error: 'GET_REDEMPTIONS_ERROR'
    });
  }
});

// @route   GET /api/users/collectors/available
// @desc    Get available collectors for assignment (Admin only)
// @access  Private (Admin only)
router.get('/collectors/available', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const collectors = await User.find({
      role: 'collector',
      isActive: true
    })
    .select('name email phone assignedReports completedTasks')
    .sort({ completedTasks: -1 });

    // Add workload information
    const collectorsWithWorkload = collectors.map(collector => ({
      ...collector.toObject(),
      currentWorkload: collector.assignedReports.length
    }));

    res.json({
      collectors: collectorsWithWorkload
    });

  } catch (error) {
    console.error('Get available collectors error:', error);
    res.status(500).json({
      message: 'Failed to get available collectors',
      error: 'GET_COLLECTORS_ERROR'
    });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get citizen leaderboard by points
// @access  Private
router.get('/leaderboard', authenticateToken, [
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await User.find({
      role: 'citizen',
      isActive: true,
      points: { $gt: 0 }
    })
    .select('name points totalReports completedReports')
    .sort({ points: -1, completedReports: -1 })
    .limit(limit);

    // Add rank information
    const leaderboardWithRanks = leaderboard.map((user, index) => ({
      ...user.toObject(),
      rank: index + 1
    }));

    res.json({
      leaderboard: leaderboardWithRanks
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      message: 'Failed to get leaderboard',
      error: 'GET_LEADERBOARD_ERROR'
    });
  }
});

// @route   PUT /api/users/:id/points/adjust
// @desc    Manually adjust user points (Admin only)
// @access  Private (Admin only)
router.put('/:id/points/adjust', authenticateToken, requireAdmin, [
  body('points').isInt().withMessage('Points must be an integer'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
  body('operation').isIn(['add', 'subtract', 'set']).withMessage('Operation must be add, subtract, or set')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { points, reason, operation } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    if (user.role !== 'citizen') {
      return res.status(400).json({
        message: 'Points can only be adjusted for citizens',
        error: 'INVALID_USER_ROLE'
      });
    }

    const oldPoints = user.points;
    let newPoints;

    switch (operation) {
      case 'add':
        newPoints = oldPoints + points;
        break;
      case 'subtract':
        newPoints = Math.max(0, oldPoints - points);
        break;
      case 'set':
        newPoints = Math.max(0, points);
        break;
    }

    user.points = newPoints;
    await user.save();

    res.json({
      message: 'Points adjusted successfully',
      oldPoints,
      newPoints,
      adjustment: newPoints - oldPoints,
      reason
    });

  } catch (error) {
    console.error('Adjust points error:', error);
    res.status(500).json({
      message: 'Failed to adjust points',
      error: 'ADJUST_POINTS_ERROR'
    });
  }
});

module.exports = router;