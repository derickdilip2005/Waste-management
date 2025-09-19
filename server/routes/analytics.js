const express = require('express');
const { query, validationResult } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const { Redemption } = require('../models/Reward');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard overview statistics
// @access  Private (Admin only)
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    // Basic counts
    const [
      totalReports,
      pendingReports,
      inProgressReports,
      completedReports,
      totalCitizens,
      totalCollectors,
      activeCollectors
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: { $in: ['submitted', 'verified'] } }),
      Report.countDocuments({ status: { $in: ['assigned', 'in_progress'] } }),
      Report.countDocuments({ status: 'completed' }),
      User.countDocuments({ role: 'citizen', isActive: true }),
      User.countDocuments({ role: 'collector', isActive: true }),
      User.countDocuments({ 
        role: 'collector', 
        isActive: true, 
        assignedReports: { $not: { $size: 0 } } 
      })
    ]);

    // Time-based statistics
    const [
      reportsThisMonth,
      reportsThisWeek,
      completedThisMonth,
      completedThisWeek
    ] = await Promise.all([
      Report.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Report.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Report.countDocuments({ 
        status: 'completed', 
        completedAt: { $gte: startOfMonth } 
      }),
      Report.countDocuments({ 
        status: 'completed', 
        completedAt: { $gte: startOfWeek } 
      })
    ]);

    // Average cleanup time
    const avgCleanupTime = await Report.aggregate([
      { $match: { status: 'completed', actualCleanupTime: { $exists: true } } },
      { $group: { _id: null, avgTime: { $avg: '$actualCleanupTime' } } }
    ]);

    // Points statistics
    const pointsStats = await User.aggregate([
      { $match: { role: 'citizen', isActive: true } },
      { 
        $group: { 
          _id: null, 
          totalPoints: { $sum: '$points' },
          avgPoints: { $avg: '$points' }
        } 
      }
    ]);

    res.json({
      overview: {
        totalReports,
        pendingReports,
        inProgressReports,
        completedReports,
        totalCitizens,
        totalCollectors,
        activeCollectors
      },
      thisMonth: {
        reports: reportsThisMonth,
        completed: completedThisMonth
      },
      thisWeek: {
        reports: reportsThisWeek,
        completed: completedThisWeek
      },
      performance: {
        avgCleanupTime: avgCleanupTime[0]?.avgTime || 0,
        completionRate: totalReports > 0 ? (completedReports / totalReports * 100).toFixed(1) : 0
      },
      points: {
        total: pointsStats[0]?.totalPoints || 0,
        average: pointsStats[0]?.avgPoints || 0
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      message: 'Failed to get dashboard analytics',
      error: 'ANALYTICS_ERROR'
    });
  }
});

// @route   GET /api/analytics/reports-timeline
// @desc    Get reports timeline data
// @access  Private (Admin only)
router.get('/reports-timeline', authenticateToken, requireAdmin, [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']),
  query('groupBy').optional().isIn(['day', 'week', 'month'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const period = req.query.period || 'month';
    const groupBy = req.query.groupBy || 'day';

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build aggregation pipeline
    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-W%U';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default: // day
        dateFormat = '%Y-%m-%d';
    }

    const timeline = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          data: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      timeline,
      period,
      groupBy,
      startDate,
      endDate: now
    });

  } catch (error) {
    console.error('Reports timeline error:', error);
    res.status(500).json({
      message: 'Failed to get reports timeline',
      error: 'TIMELINE_ERROR'
    });
  }
});

// @route   GET /api/analytics/status-distribution
// @desc    Get report status distribution
// @access  Private (Admin only)
router.get('/status-distribution', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const distribution = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    
    const distributionWithPercentage = distribution.map(item => ({
      status: item._id,
      count: item.count,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0
    }));

    res.json({
      distribution: distributionWithPercentage,
      total
    });

  } catch (error) {
    console.error('Status distribution error:', error);
    res.status(500).json({
      message: 'Failed to get status distribution',
      error: 'DISTRIBUTION_ERROR'
    });
  }
});

// @route   GET /api/analytics/waste-types
// @desc    Get waste type distribution
// @access  Private (Admin only)
router.get('/waste-types', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const wasteTypes = await Report.aggregate([
      { $match: { 'mlClassification.wasteType': { $exists: true } } },
      {
        $group: {
          _id: '$mlClassification.wasteType',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$mlClassification.confidence' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const total = wasteTypes.reduce((sum, item) => sum + item.count, 0);
    
    const wasteTypesWithPercentage = wasteTypes.map(item => ({
      type: item._id,
      count: item.count,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0,
      avgConfidence: item.avgConfidence ? (item.avgConfidence * 100).toFixed(1) : 0
    }));

    res.json({
      wasteTypes: wasteTypesWithPercentage,
      total
    });

  } catch (error) {
    console.error('Waste types error:', error);
    res.status(500).json({
      message: 'Failed to get waste types',
      error: 'WASTE_TYPES_ERROR'
    });
  }
});

// @route   GET /api/analytics/hotspots
// @desc    Get waste hotspots (areas with high report density)
// @access  Private (Admin only)
router.get('/hotspots', authenticateToken, requireAdmin, [
  query('radius').optional().isFloat({ min: 0.1, max: 10 }),
  query('minReports').optional().isInt({ min: 2, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const radius = parseFloat(req.query.radius) || 1; // km
    const minReports = parseInt(req.query.minReports) || 5;

    // This is a simplified hotspot detection
    // In production, you might want to use more sophisticated clustering algorithms
    const hotspots = await Report.aggregate([
      {
        $group: {
          _id: {
            lat: { $round: [{ $multiply: ['$location.coordinates.lat', 100] }, 0] },
            lng: { $round: [{ $multiply: ['$location.coordinates.lng', 100] }, 0] }
          },
          count: { $sum: 1 },
          reports: { $push: '$_id' },
          avgLat: { $avg: '$location.coordinates.lat' },
          avgLng: { $avg: '$location.coordinates.lng' },
          statuses: { $push: '$status' }
        }
      },
      { $match: { count: { $gte: minReports } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    const hotspotsWithStats = hotspots.map(hotspot => {
      const statusCounts = hotspot.statuses.reduce((acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      return {
        location: {
          lat: hotspot.avgLat,
          lng: hotspot.avgLng
        },
        reportCount: hotspot.count,
        statusBreakdown: statusCounts,
        severity: hotspot.count >= 20 ? 'high' : hotspot.count >= 10 ? 'medium' : 'low'
      };
    });

    res.json({
      hotspots: hotspotsWithStats,
      parameters: {
        radius,
        minReports
      }
    });

  } catch (error) {
    console.error('Hotspots error:', error);
    res.status(500).json({
      message: 'Failed to get hotspots',
      error: 'HOTSPOTS_ERROR'
    });
  }
});

// @route   GET /api/analytics/top-citizens
// @desc    Get top performing citizens
// @access  Private (Admin only)
router.get('/top-citizens', authenticateToken, requireAdmin, [
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sortBy').optional().isIn(['points', 'reports', 'completedReports'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'points';

    let sortField;
    switch (sortBy) {
      case 'reports':
        sortField = { totalReports: -1 };
        break;
      case 'completedReports':
        sortField = { completedReports: -1 };
        break;
      default:
        sortField = { points: -1 };
    }

    const topCitizens = await User.find({
      role: 'citizen',
      isActive: true,
      [sortBy]: { $gt: 0 }
    })
    .select('name email points totalReports completedReports createdAt')
    .sort(sortField)
    .limit(limit);

    const citizensWithRank = topCitizens.map((citizen, index) => ({
      ...citizen.toObject(),
      rank: index + 1,
      completionRate: citizen.totalReports > 0 ? 
        ((citizen.completedReports / citizen.totalReports) * 100).toFixed(1) : 0
    }));

    res.json({
      topCitizens: citizensWithRank,
      sortBy,
      limit
    });

  } catch (error) {
    console.error('Top citizens error:', error);
    res.status(500).json({
      message: 'Failed to get top citizens',
      error: 'TOP_CITIZENS_ERROR'
    });
  }
});

// @route   GET /api/analytics/collector-performance
// @desc    Get collector performance statistics
// @access  Private (Admin only)
router.get('/collector-performance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const collectors = await User.find({
      role: 'collector',
      isActive: true
    }).select('name email completedTasks assignedReports');

    const collectorStats = await Promise.all(
      collectors.map(async (collector) => {
        // Get average cleanup time for this collector
        const avgCleanupTime = await Report.aggregate([
          { 
            $match: { 
              assignedTo: collector._id,
              status: 'completed',
              actualCleanupTime: { $exists: true }
            }
          },
          { $group: { _id: null, avgTime: { $avg: '$actualCleanupTime' } } }
        ]);

        // Get reports completed this month
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const completedThisMonth = await Report.countDocuments({
          assignedTo: collector._id,
          status: 'completed',
          completedAt: { $gte: startOfMonth }
        });

        return {
          id: collector._id,
          name: collector.name,
          email: collector.email,
          totalCompleted: collector.completedTasks,
          currentAssigned: collector.assignedReports.length,
          completedThisMonth,
          avgCleanupTime: avgCleanupTime[0]?.avgTime || 0,
          efficiency: collector.completedTasks > 0 ? 
            (collector.completedTasks / (collector.completedTasks + collector.assignedReports.length) * 100).toFixed(1) : 0
        };
      })
    );

    // Sort by efficiency
    collectorStats.sort((a, b) => parseFloat(b.efficiency) - parseFloat(a.efficiency));

    res.json({
      collectors: collectorStats
    });

  } catch (error) {
    console.error('Collector performance error:', error);
    res.status(500).json({
      message: 'Failed to get collector performance',
      error: 'COLLECTOR_PERFORMANCE_ERROR'
    });
  }
});

// @route   GET /api/analytics/rewards-usage
// @desc    Get rewards and redemption statistics
// @access  Private (Admin only)
router.get('/rewards-usage', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalRedemptions,
      totalPointsRedeemed,
      redemptionsByStatus,
      popularRewards
    ] = await Promise.all([
      Redemption.countDocuments(),
      Redemption.aggregate([
        { $group: { _id: null, total: { $sum: '$pointsUsed' } } }
      ]),
      Redemption.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Redemption.aggregate([
        {
          $group: {
            _id: '$reward',
            count: { $sum: 1 },
            totalPoints: { $sum: '$pointsUsed' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'rewards',
            localField: '_id',
            foreignField: '_id',
            as: 'rewardInfo'
          }
        }
      ])
    ]);

    res.json({
      overview: {
        totalRedemptions,
        totalPointsRedeemed: totalPointsRedeemed[0]?.total || 0
      },
      statusDistribution: redemptionsByStatus,
      popularRewards: popularRewards.map(item => ({
        reward: item.rewardInfo[0],
        redemptionCount: item.count,
        totalPointsUsed: item.totalPoints
      }))
    });

  } catch (error) {
    console.error('Rewards usage error:', error);
    res.status(500).json({
      message: 'Failed to get rewards usage',
      error: 'REWARDS_USAGE_ERROR'
    });
  }
});

module.exports = router;