const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['citizen', 'admin', 'collector'],
    default: 'citizen'
  },
  // Citizen-specific fields
  points: {
    type: Number,
    default: 0
  },
  totalReports: {
    type: Number,
    default: 0
  },
  completedReports: {
    type: Number,
    default: 0
  },
  // Collector-specific fields
  assignedReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  }],
  completedTasks: {
    type: Number,
    default: 0
  },
  // Profile information
  avatar: {
    type: String,
    default: ''
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // Notification preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  // Timestamps
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (exclude sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Add points to citizen
userSchema.methods.addPoints = function(points) {
  if (this.role === 'citizen') {
    this.points += points;
    return this.save();
  }
  throw new Error('Only citizens can earn points');
};

// Deduct points from citizen
userSchema.methods.deductPoints = function(points) {
  if (this.role === 'citizen' && this.points >= points) {
    this.points -= points;
    return this.save();
  }
  throw new Error('Insufficient points or invalid user role');
};

module.exports = mongoose.model('User', userSchema);