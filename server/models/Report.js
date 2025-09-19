const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Report identification
  reportId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Citizen who submitted the report
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Report details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // Location information
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    landmark: String
  },
  
  // Images
  images: {
    original: {
      url: String,
      publicId: String
    },
    beforeCleanup: {
      url: String,
      publicId: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: Date
    },
    afterCleanup: {
      url: String,
      publicId: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: Date
    }
  },
  
  // ML Classification
  mlClassification: {
    isWaste: {
      type: Boolean,
      default: null
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    wasteType: {
      type: String,
      enum: ['plastic', 'organic', 'metal', 'glass', 'paper', 'electronic', 'hazardous', 'mixed', 'unknown'],
      default: 'unknown'
    },
    processedAt: Date
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['submitted', 'verified', 'assigned', 'in_progress', 'completed', 'rejected'],
    default: 'submitted'
  },
  
  // Assignment and completion
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  
  // Admin actions
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  verificationNotes: String,
  
  // Completion details
  completedAt: Date,
  completionNotes: String,
  
  // Points and rewards
  pointsAwarded: {
    type: Number,
    default: 0
  },
  pointsAwardedAt: Date,
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Additional metadata
  tags: [String],
  estimatedCleanupTime: Number, // in minutes
  actualCleanupTime: Number, // in minutes
  
  // Status history for tracking
  statusHistory: [{
    status: {
      type: String,
      enum: ['submitted', 'verified', 'assigned', 'in_progress', 'completed', 'rejected']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique report ID before saving
reportSchema.pre('save', async function(next) {
  if (this.isNew && !this.reportId) {
    const count = await mongoose.model('Report').countDocuments();
    this.reportId = `WR${String(count + 1).padStart(6, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Add status change to history
reportSchema.methods.changeStatus = function(newStatus, changedBy, notes = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedBy,
    changedAt: new Date(),
    notes
  });
  
  // Update specific timestamps based on status
  switch (newStatus) {
    case 'verified':
      this.verifiedBy = changedBy;
      this.verifiedAt = new Date();
      break;
    case 'assigned':
      this.assignedAt = new Date();
      break;
    case 'completed':
      this.completedAt = new Date();
      break;
  }
  
  return this.save();
};

// Calculate distance between two coordinates (Haversine formula)
reportSchema.statics.calculateDistance = function(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find nearby reports
reportSchema.statics.findNearby = function(lat, lng, radiusKm = 5) {
  return this.find({
    'location.coordinates.lat': {
      $gte: lat - (radiusKm / 111), // Rough conversion: 1 degree ≈ 111 km
      $lte: lat + (radiusKm / 111)
    },
    'location.coordinates.lng': {
      $gte: lng - (radiusKm / (111 * Math.cos(lat * Math.PI / 180))),
      $lte: lng + (radiusKm / (111 * Math.cos(lat * Math.PI / 180)))
    }
  });
};

// Indexes for better query performance
reportSchema.index({ citizen: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ assignedTo: 1, status: 1 });
reportSchema.index({ 'location.coordinates.lat': 1, 'location.coordinates.lng': 1 });
reportSchema.index({ reportId: 1 });

module.exports = mongoose.model('Report', reportSchema);