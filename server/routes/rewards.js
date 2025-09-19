const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Mock rewards data (in a real app, this would be in a database)
let rewards = [
  {
    _id: 'reward_1',
    title: '$5 Coffee Shop Voucher',
    description: 'Enjoy a free coffee at participating local coffee shops',
    type: 'coupon',
    pointsRequired: 100,
    value: 5,
    partnerName: 'Local Coffee Co.',
    partnerLogo: null,
    isActive: true,
    availableQuantity: 50,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    terms: 'Valid at participating locations only. Cannot be combined with other offers.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'reward_2',
    title: '10% Discount on Eco Products',
    description: 'Get 10% off on eco-friendly products at GreenStore',
    type: 'discount',
    pointsRequired: 150,
    value: 10,
    partnerName: 'GreenStore',
    partnerLogo: null,
    isActive: true,
    availableQuantity: 100,
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    terms: 'Minimum purchase of $50 required. Valid on eco-friendly products only.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'reward_3',
    title: 'Reusable Water Bottle',
    description: 'High-quality stainless steel water bottle with eco-friendly design',
    type: 'gift',
    pointsRequired: 300,
    value: 25,
    partnerName: 'EcoBottle Co.',
    partnerLogo: null,
    isActive: true,
    availableQuantity: 25,
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    terms: 'Free shipping included. Allow 5-7 business days for delivery.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'reward_4',
    title: 'Tree Planting Certificate',
    description: 'Plant a tree in your name and receive a digital certificate',
    type: 'gift',
    pointsRequired: 200,
    value: 15,
    partnerName: 'Green Earth Foundation',
    partnerLogo: null,
    isActive: true,
    availableQuantity: 1000,
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    terms: 'Digital certificate will be emailed within 48 hours. Tree planting location will be confirmed.',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'reward_5',
    title: '$20 Restaurant Voucher',
    description: 'Enjoy a meal at participating eco-conscious restaurants',
    type: 'coupon',
    pointsRequired: 400,
    value: 20,
    partnerName: 'Green Dining Network',
    partnerLogo: null,
    isActive: true,
    availableQuantity: 30,
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    terms: 'Valid at participating restaurants only. Reservation required.',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock redemptions data
let redemptions = [];

// Helper function to generate coupon codes
const generateCouponCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Get all active rewards
router.get('/', async (req, res) => {
  try {
    const activeRewards = rewards.filter(reward => reward.isActive);
    
    res.json({
      success: true,
      rewards: activeRewards
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch rewards',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get reward by ID
router.get('/:id', async (req, res) => {
  try {
    const reward = rewards.find(r => r._id === req.params.id);
    
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }
    
    res.json({
      success: true,
      reward
    });
  } catch (error) {
    console.error('Get reward error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch reward',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Redeem a reward
router.post('/:id/redeem', authenticateToken, async (req, res) => {
  try {
    const reward = rewards.find(r => r._id === req.params.id);
    
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }
    
    if (!reward.isActive) {
      return res.status(400).json({ message: 'Reward is not active' });
    }
    
    if (reward.availableQuantity <= 0) {
      return res.status(400).json({ message: 'Reward is out of stock' });
    }
    
    if (new Date() > new Date(reward.validUntil)) {
      return res.status(400).json({ message: 'Reward has expired' });
    }
    
    // Get user and check points
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.points < reward.pointsRequired) {
      return res.status(400).json({ 
        message: 'Insufficient points',
        required: reward.pointsRequired,
        available: user.points
      });
    }
    
    // Create redemption
    const redemption = {
      _id: `redemption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user._id,
      rewardId: reward._id,
      couponCode: generateCouponCode(),
      pointsUsed: reward.pointsRequired,
      isUsed: false,
      usedAt: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: new Date()
    };
    
    // Add to redemptions array
    redemptions.push(redemption);
    
    // Deduct points from user
    user.points -= reward.pointsRequired;
    await user.save();
    
    // Reduce available quantity
    reward.availableQuantity -= 1;
    
    // Log the redemption
    console.log(`Reward redeemed - User: ${user.email}, Reward: ${reward.title}, Points: ${reward.pointsRequired}`);
    
    res.json({
      success: true,
      message: 'Reward redeemed successfully',
      redemption: {
        ...redemption,
        reward: {
          title: reward.title,
          type: reward.type,
          value: reward.value
        }
      }
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({ 
      message: 'Failed to redeem reward',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's redemption history
router.get('/my-redemptions', authenticateToken, async (req, res) => {
  try {
    const userRedemptions = redemptions
      .filter(redemption => redemption.userId.toString() === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Add reward details to each redemption
    const redemptionsWithRewards = userRedemptions.map(redemption => {
      const reward = rewards.find(r => r._id === redemption.rewardId);
      return {
        ...redemption,
        reward: reward ? {
          title: reward.title,
          type: reward.type,
          value: reward.value,
          partnerName: reward.partnerName,
          terms: reward.terms
        } : null
      };
    });
    
    res.json({
      success: true,
      redemptions: redemptionsWithRewards
    });
  } catch (error) {
    console.error('Get redemptions error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch redemptions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Mark redemption as used (for partners)
router.put('/redemptions/:id/use', authenticateToken, async (req, res) => {
  try {
    const redemption = redemptions.find(r => r._id === req.params.id);
    
    if (!redemption) {
      return res.status(404).json({ message: 'Redemption not found' });
    }
    
    // Check if user owns this redemption or is admin
    if (redemption.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (redemption.isUsed) {
      return res.status(400).json({ message: 'Redemption already used' });
    }
    
    if (new Date() > new Date(redemption.expiresAt)) {
      return res.status(400).json({ message: 'Redemption has expired' });
    }
    
    // Mark as used
    redemption.isUsed = true;
    redemption.usedAt = new Date();
    
    res.json({
      success: true,
      message: 'Redemption marked as used',
      redemption
    });
  } catch (error) {
    console.error('Use redemption error:', error);
    res.status(500).json({ 
      message: 'Failed to mark redemption as used',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Admin routes

// Create new reward (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const {
      title,
      description,
      type,
      pointsRequired,
      value,
      partnerName,
      partnerLogo,
      availableQuantity,
      validUntil,
      terms
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !type || !pointsRequired || !value) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const newReward = {
      _id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      type,
      pointsRequired: parseInt(pointsRequired),
      value: parseFloat(value),
      partnerName: partnerName || null,
      partnerLogo: partnerLogo || null,
      isActive: true,
      availableQuantity: parseInt(availableQuantity) || 1,
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      terms: terms || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    rewards.push(newReward);
    
    res.status(201).json({
      success: true,
      message: 'Reward created successfully',
      reward: newReward
    });
  } catch (error) {
    console.error('Create reward error:', error);
    res.status(500).json({ 
      message: 'Failed to create reward',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update reward (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const rewardIndex = rewards.findIndex(r => r._id === req.params.id);
    
    if (rewardIndex === -1) {
      return res.status(404).json({ message: 'Reward not found' });
    }
    
    const updatedReward = {
      ...rewards[rewardIndex],
      ...req.body,
      updatedAt: new Date()
    };
    
    rewards[rewardIndex] = updatedReward;
    
    res.json({
      success: true,
      message: 'Reward updated successfully',
      reward: updatedReward
    });
  } catch (error) {
    console.error('Update reward error:', error);
    res.status(500).json({ 
      message: 'Failed to update reward',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete reward (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const rewardIndex = rewards.findIndex(r => r._id === req.params.id);
    
    if (rewardIndex === -1) {
      return res.status(404).json({ message: 'Reward not found' });
    }
    
    rewards.splice(rewardIndex, 1);
    
    res.json({
      success: true,
      message: 'Reward deleted successfully'
    });
  } catch (error) {
    console.error('Delete reward error:', error);
    res.status(500).json({ 
      message: 'Failed to delete reward',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get admin analytics
router.get('/admin/analytics', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const analytics = {
      totalRewards: rewards.length,
      activeRewards: rewards.filter(r => r.isActive).length,
      totalRedemptions: redemptions.length,
      usedRedemptions: redemptions.filter(r => r.isUsed).length,
      totalPointsRedeemed: redemptions.reduce((sum, r) => sum + r.pointsUsed, 0),
      popularRewards: rewards
        .map(reward => ({
          ...reward,
          redemptionCount: redemptions.filter(r => r.rewardId === reward._id).length
        }))
        .sort((a, b) => b.redemptionCount - a.redemptionCount)
        .slice(0, 5),
      recentRedemptions: redemptions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(redemption => {
          const reward = rewards.find(r => r._id === redemption.rewardId);
          return {
            ...redemption,
            rewardTitle: reward ? reward.title : 'Unknown Reward'
          };
        })
    };
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get rewards analytics error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch rewards analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;