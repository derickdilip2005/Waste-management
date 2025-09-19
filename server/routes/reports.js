const express = require('express');
const multer = require('multer');
const { body, validationResult, query } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const { 
  authenticateToken, 
  requireCitizen, 
  requireAdmin, 
  requireCollector,
  requireAdminOrCollector,
  requireOwnershipOrAdmin 
} = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Validation rules
const reportValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('location.coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('location.coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('location.landmark')
    .optional()
    .trim()
];

// @route   POST /api/reports
// @desc    Submit a new waste report
// @access  Private (Citizens only)
router.post('/', authenticateToken, requireCitizen, upload.single('image'), reportValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Image is required',
        error: 'NO_IMAGE'
      });
    }

    const { title, description, location, priority = 'medium' } = req.body;

    // Create new report
    const report = new Report({
      citizen: req.user._id,
      title,
      description,
      location: JSON.parse(location), // Parse location from string
      priority,
      images: {
        original: {
          // In production, upload to Cloudinary or similar service
          url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          publicId: `report_${Date.now()}`
        }
      }
    });

    await report.save();

    // Update user's total reports count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalReports: 1 }
    });

    // Populate citizen info for response
    await report.populate('citizen', 'name email');

    res.status(201).json({
      message: 'Report submitted successfully',
      report
    });

  } catch (error) {
    console.error('Report submission error:', error);
    res.status(500).json({
      message: 'Failed to submit report',
      error: 'SUBMISSION_ERROR'
    });
  }
});

// @route   GET /api/reports
// @desc    Get reports with filtering and pagination
// @access  Private
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['submitted', 'verified', 'assigned', 'in_progress', 'completed', 'rejected']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('citizenId').optional().isMongoId(),
  query('assignedTo').optional().isMongoId()
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

    // Build filter based on user role and query parameters
    let filter = {};

    // Role-based filtering
    if (req.user.role === 'citizen') {
      filter.citizen = req.user._id;
    } else if (req.user.role === 'collector') {
      filter.assignedTo = req.user._id;
    }
    // Admins can see all reports

    // Apply query filters
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.citizenId && req.user.role === 'admin') filter.citizen = req.query.citizenId;
    if (req.query.assignedTo && req.user.role === 'admin') filter.assignedTo = req.query.assignedTo;

    // Date range filtering
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
    }

    const reports = await Report.find(filter)
      .populate('citizen', 'name email')
      .populate('assignedTo', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      message: 'Failed to get reports',
      error: 'GET_REPORTS_ERROR'
    });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('citizen', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .populate('verifiedBy', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
        error: 'REPORT_NOT_FOUND'
      });
    }

    // Check access permissions
    if (req.user.role === 'citizen' && report.citizen._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    if (req.user.role === 'collector' && 
        (!report.assignedTo || report.assignedTo._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    res.json({ report });

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      message: 'Failed to get report',
      error: 'GET_REPORT_ERROR'
    });
  }
});

// @route   PUT /api/reports/:id/verify
// @desc    Verify/reject a report (Admin only)
// @access  Private (Admin only)
router.put('/:id/verify', authenticateToken, requireAdmin, [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { action, notes } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
        error: 'REPORT_NOT_FOUND'
      });
    }

    if (report.status !== 'submitted') {
      return res.status(400).json({
        message: 'Report can only be verified when in submitted status',
        error: 'INVALID_STATUS'
      });
    }

    const newStatus = action === 'approve' ? 'verified' : 'rejected';
    await report.changeStatus(newStatus, req.user._id, notes);

    if (action === 'reject') {
      report.verificationNotes = notes;
      await report.save();
    }

    await report.populate('citizen', 'name email');

    res.json({
      message: `Report ${action}d successfully`,
      report
    });

  } catch (error) {
    console.error('Verify report error:', error);
    res.status(500).json({
      message: 'Failed to verify report',
      error: 'VERIFY_ERROR'
    });
  }
});

// @route   PUT /api/reports/:id/assign
// @desc    Assign report to collector (Admin only)
// @access  Private (Admin only)
router.put('/:id/assign', authenticateToken, requireAdmin, [
  body('collectorId').isMongoId().withMessage('Valid collector ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { collectorId } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
        error: 'REPORT_NOT_FOUND'
      });
    }

    if (report.status !== 'verified') {
      return res.status(400).json({
        message: 'Report must be verified before assignment',
        error: 'INVALID_STATUS'
      });
    }

    // Verify collector exists and has correct role
    const collector = await User.findById(collectorId);
    if (!collector || collector.role !== 'collector') {
      return res.status(400).json({
        message: 'Invalid collector',
        error: 'INVALID_COLLECTOR'
      });
    }

    report.assignedTo = collectorId;
    await report.changeStatus('assigned', req.user._id, `Assigned to ${collector.name}`);

    // Add to collector's assigned reports
    await User.findByIdAndUpdate(collectorId, {
      $addToSet: { assignedReports: report._id }
    });

    await report.populate(['citizen', 'assignedTo'], 'name email');

    res.json({
      message: 'Report assigned successfully',
      report
    });

  } catch (error) {
    console.error('Assign report error:', error);
    res.status(500).json({
      message: 'Failed to assign report',
      error: 'ASSIGN_ERROR'
    });
  }
});

// @route   PUT /api/reports/:id/start
// @desc    Start working on assigned report (Collector only)
// @access  Private (Collector only)
router.put('/:id/start', authenticateToken, requireCollector, upload.single('beforeImage'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
        error: 'REPORT_NOT_FOUND'
      });
    }

    if (report.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You can only start reports assigned to you',
        error: 'ACCESS_DENIED'
      });
    }

    if (report.status !== 'assigned') {
      return res.status(400).json({
        message: 'Report must be in assigned status to start',
        error: 'INVALID_STATUS'
      });
    }

    // Upload before image if provided
    if (req.file) {
      report.images.beforeCleanup = {
        url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        publicId: `before_${report._id}_${Date.now()}`,
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      };
    }

    await report.changeStatus('in_progress', req.user._id, 'Started cleanup work');

    res.json({
      message: 'Report started successfully',
      report
    });

  } catch (error) {
    console.error('Start report error:', error);
    res.status(500).json({
      message: 'Failed to start report',
      error: 'START_ERROR'
    });
  }
});

// @route   PUT /api/reports/:id/complete
// @desc    Complete assigned report (Collector only)
// @access  Private (Collector only)
router.put('/:id/complete', authenticateToken, requireCollector, upload.single('afterImage'), [
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
        error: 'REPORT_NOT_FOUND'
      });
    }

    if (report.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You can only complete reports assigned to you',
        error: 'ACCESS_DENIED'
      });
    }

    if (report.status !== 'in_progress') {
      return res.status(400).json({
        message: 'Report must be in progress to complete',
        error: 'INVALID_STATUS'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'After cleanup image is required',
        error: 'NO_AFTER_IMAGE'
      });
    }

    // Upload after image
    report.images.afterCleanup = {
      url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      publicId: `after_${report._id}_${Date.now()}`,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    report.completionNotes = req.body.notes || '';
    
    // Calculate cleanup time if start time is available
    if (report.statusHistory.find(h => h.status === 'in_progress')) {
      const startTime = report.statusHistory.find(h => h.status === 'in_progress').changedAt;
      report.actualCleanupTime = Math.round((new Date() - startTime) / (1000 * 60)); // in minutes
    }

    await report.changeStatus('completed', req.user._id, req.body.notes || 'Cleanup completed');

    // Update collector's completed tasks count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { completedTasks: 1 },
      $pull: { assignedReports: report._id }
    });

    res.json({
      message: 'Report completed successfully',
      report
    });

  } catch (error) {
    console.error('Complete report error:', error);
    res.status(500).json({
      message: 'Failed to complete report',
      error: 'COMPLETE_ERROR'
    });
  }
});

// @route   PUT /api/reports/:id/award-points
// @desc    Award points to citizen for completed report (Admin only)
// @access  Private (Admin only)
router.put('/:id/award-points', authenticateToken, requireAdmin, [
  body('points').isInt({ min: 1, max: 1000 }).withMessage('Points must be between 1 and 1000')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { points } = req.body;
    const report = await Report.findById(req.params.id).populate('citizen');

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
        error: 'REPORT_NOT_FOUND'
      });
    }

    if (report.status !== 'completed') {
      return res.status(400).json({
        message: 'Points can only be awarded for completed reports',
        error: 'INVALID_STATUS'
      });
    }

    if (report.pointsAwarded > 0) {
      return res.status(400).json({
        message: 'Points have already been awarded for this report',
        error: 'POINTS_ALREADY_AWARDED'
      });
    }

    // Award points to citizen
    await report.citizen.addPoints(points);
    
    // Update report
    report.pointsAwarded = points;
    report.pointsAwardedAt = new Date();
    await report.save();

    // Update citizen's completed reports count
    await User.findByIdAndUpdate(report.citizen._id, {
      $inc: { completedReports: 1 }
    });

    res.json({
      message: 'Points awarded successfully',
      report,
      citizenPoints: report.citizen.points + points
    });

  } catch (error) {
    console.error('Award points error:', error);
    res.status(500).json({
      message: 'Failed to award points',
      error: 'AWARD_POINTS_ERROR'
    });
  }
});

// @route   GET /api/reports/nearby
// @desc    Get nearby reports
// @access  Private
router.get('/nearby', authenticateToken, [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('radius').optional().isFloat({ min: 0.1, max: 50 }).withMessage('Radius must be between 0.1 and 50 km')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { lat, lng, radius = 5 } = req.query;
    
    const nearbyReports = await Report.findNearby(
      parseFloat(lat), 
      parseFloat(lng), 
      parseFloat(radius)
    ).populate('citizen', 'name');

    res.json({
      reports: nearbyReports,
      center: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius: parseFloat(radius)
    });

  } catch (error) {
    console.error('Get nearby reports error:', error);
    res.status(500).json({
      message: 'Failed to get nearby reports',
      error: 'NEARBY_REPORTS_ERROR'
    });
  }
});

module.exports = router;