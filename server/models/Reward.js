const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  // Reward details
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
  
  // Point cost
  pointsCost: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Reward type
  type: {
    type: String,
    enum: ['coupon', 'discount', 'gift_card', 'merchandise', 'service'],
    default: 'coupon'
  },
  
  // Coupon/discount details
  couponCode: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  discountAmount: {
    type: Number,
    min: 0
  },
  
  // Availability
  isActive: {
    type: Boolean,
    default: true
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  remainingQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Validity
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  
  // Partner/merchant information
  partner: {
    name: String,
    logo: String,
    website: String,
    category: {
      type: String,
      enum: ['food', 'retail', 'entertainment', 'transport', 'health', 'education', 'other'],
      default: 'other'
    }
  },
  
  // Terms and conditions
  termsAndConditions: String,
  minimumPurchase: {
    type: Number,
    default: 0
  },
  
  // Usage tracking
  totalRedeemed: {
    type: Number,
    default: 0
  },
  
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

// Redemption tracking schema
const redemptionSchema = new mongoose.Schema({
  // User who redeemed
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Reward redeemed
  reward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward',
    required: true
  },
  
  // Redemption details
  pointsUsed: {
    type: Number,
    required: true
  },
  
  // Generated coupon code (if applicable)
  generatedCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'used', 'expired', 'cancelled'],
    default: 'active'
  },
  
  // Usage tracking
  usedAt: Date,
  usedLocation: String,
  
  // Expiry
  expiresAt: {
    type: Date,
    required: true
  },
  
  // Timestamps
  redeemedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
rewardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

redemptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate unique coupon code
rewardSchema.methods.generateCouponCode = function() {
  const prefix = this.partner.name ? this.partner.name.substring(0, 3).toUpperCase() : 'WMS';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Check if reward is available
rewardSchema.methods.isAvailable = function() {
  const now = new Date();
  return this.isActive && 
         this.remainingQuantity > 0 && 
         now >= this.validFrom && 
         now <= this.validUntil;
};

// Redeem reward
rewardSchema.methods.redeem = async function(userId) {
  if (!this.isAvailable()) {
    throw new Error('Reward is not available for redemption');
  }
  
  // Decrease remaining quantity
  this.remainingQuantity -= 1;
  this.totalRedeemed += 1;
  
  // Create redemption record
  const Redemption = mongoose.model('Redemption');
  const redemption = new Redemption({
    user: userId,
    reward: this._id,
    pointsUsed: this.pointsCost,
    generatedCode: this.generateCouponCode(),
    expiresAt: this.validUntil
  });
  
  await this.save();
  await redemption.save();
  
  return redemption;
};

// Static method to get available rewards
rewardSchema.statics.getAvailable = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    remainingQuantity: { $gt: 0 },
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  }).sort({ pointsCost: 1 });
};

// Indexes
rewardSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
rewardSchema.index({ pointsCost: 1 });
rewardSchema.index({ 'partner.category': 1 });

redemptionSchema.index({ user: 1, redeemedAt: -1 });
redemptionSchema.index({ reward: 1 });
redemptionSchema.index({ status: 1, expiresAt: 1 });

const Reward = mongoose.model('Reward', rewardSchema);
const Redemption = mongoose.model('Redemption', redemptionSchema);

module.exports = { Reward, Redemption };