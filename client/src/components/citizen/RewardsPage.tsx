import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Reward, Redemption } from '../../types';

const RewardsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'redeemed'>('available');

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const fetchRewardsData = () => {
    setLoading(true);
    
    // Mock rewards data
    const mockRewards: Reward[] = [
      {
        _id: '1',
        title: 'Coffee Shop Discount',
        description: '20% off at local coffee shops',
        pointsRequired: 100,
        type: 'coupon',
        value: 20,
        isActive: true,
        availableQuantity: 50,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        partnerName: 'Local Coffee Shops',
        terms: 'Valid at participating locations only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        title: '20% Off Eco-Friendly Products',
        description: 'Get 20% discount on eco-friendly household products',
        pointsRequired: 150,
        type: 'discount',
        value: 20,
        isActive: true,
        availableQuantity: 30,
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        partnerName: 'Eco Store',
        terms: 'Valid on selected eco-friendly products only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '3',
        title: 'Free Movie Ticket',
        description: 'Complimentary movie ticket at participating cinemas',
        pointsRequired: 200,
        type: 'gift',
        value: 15,
        isActive: true,
        availableQuantity: 20,
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        partnerName: 'Cinema Chain',
        terms: 'Subject to availability and cinema terms',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Mock redemptions data
    const mockRedemptions: Redemption[] = [
      {
        _id: '1',
        userId: user?._id || '1',
        rewardId: '1',
        pointsUsed: 100,
        couponCode: 'COFFEE123',
        isUsed: false,
        expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    setTimeout(() => {
      setRewards(mockRewards);
      setRedemptions(mockRedemptions);
      setLoading(false);
    }, 500);
  };

  const handleRedeem = (rewardId: string) => {
    const reward = rewards.find(r => r._id === rewardId);
    if (!reward || !user) return;

    if (user.points! < reward.pointsRequired) {
      setError('Insufficient points to redeem this reward');
      return;
    }

    setRedeeming(rewardId);
    setError(null);
    
    // Mock redemption process
    setTimeout(() => {
      const couponCode = `REWARD${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const newRedemption: Redemption = {
        _id: Date.now().toString(),
        userId: user._id || '1',
        rewardId: rewardId,
        couponCode: couponCode,
        pointsUsed: reward.pointsRequired,
        isUsed: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update user points
      updateUser({ points: user.points! - reward.pointsRequired });
      
      // Add to redemptions list
      setRedemptions(prev => [newRedemption, ...prev]);
      
      // Show success message
      alert(`Successfully redeemed ${reward.title}! Your coupon code is: ${couponCode}`);
      
      setRedeeming(null);
    }, 1500);
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'coupon': return '🎟️';
      case 'discount': return '💰';
      case 'gift': return '🎁';
      default: return '🏆';
    }
  };

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'coupon': return 'bg-blue-100 text-blue-800';
      case 'discount': return 'bg-green-100 text-green-800';
      case 'gift': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg shadow p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Rewards Store 🏆</h1>
        <p className="text-purple-100 mb-4">
          Redeem your points for amazing rewards and discounts!
        </p>
        <div className="flex items-center space-x-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="text-2xl font-bold">{user?.points || 0}</div>
            <div className="text-sm text-purple-100">Available Points</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="text-2xl font-bold">{redemptions.length}</div>
            <div className="text-sm text-purple-100">Rewards Redeemed</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('available')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'available'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Available Rewards ({rewards.filter(r => r.isActive).length})
            </button>
            <button
              onClick={() => setActiveTab('redeemed')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'redeemed'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Redemptions ({redemptions.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'available' && (
            <div>
              {rewards.filter(r => r.isActive).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rewards available</h3>
                  <p className="text-gray-500">Check back later for new rewards!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rewards.filter(r => r.isActive).map((reward) => (
                    <div key={reward._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getRewardTypeIcon(reward.type)}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getRewardTypeColor(reward.type)}`}>
                            {reward.type.toUpperCase()}
                          </span>
                        </div>
                        {reward.partnerLogo && (
                          <img
                            src={reward.partnerLogo}
                            alt={reward.partnerName}
                            className="w-8 h-8 rounded"
                          />
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{reward.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{reward.description}</p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Points Required:</span>
                          <span className="font-semibold text-purple-600">{reward.pointsRequired}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Value:</span>
                          <span className="font-semibold text-green-600">${reward.value}</span>
                        </div>
                        {reward.availableQuantity > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Available:</span>
                            <span className="text-sm text-gray-900">{reward.availableQuantity} left</span>
                          </div>
                        )}
                        {reward.validUntil && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Valid Until:</span>
                            <span className="text-sm text-gray-900">
                              {new Date(reward.validUntil).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {reward.partnerName && (
                        <div className="mb-4">
                          <span className="text-xs text-gray-500">Partner: {reward.partnerName}</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleRedeem(reward._id)}
                        disabled={
                          redeeming === reward._id ||
                          (user?.points || 0) < reward.pointsRequired ||
                          reward.availableQuantity === 0
                        }
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          (user?.points || 0) >= reward.pointsRequired && reward.availableQuantity > 0
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {redeeming === reward._id ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Redeeming...
                          </div>
                        ) : (user?.points || 0) < reward.pointsRequired ? (
                          `Need ${reward.pointsRequired - (user?.points || 0)} more points`
                        ) : reward.availableQuantity === 0 ? (
                          'Out of Stock'
                        ) : (
                          'Redeem Now'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'redeemed' && (
            <div>
              {redemptions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎁</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No redemptions yet</h3>
                  <p className="text-gray-500">Start earning points and redeem your first reward!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {redemptions.map((redemption) => {
                    const reward = rewards.find(r => r._id === redemption.rewardId);
                    return (
                      <div key={redemption._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg">{reward ? getRewardTypeIcon(reward.type) : '🏆'}</span>
                              <h3 className="font-semibold text-gray-900">
                                {reward?.title || 'Reward'}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                redemption.isUsed ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {redemption.isUsed ? 'USED' : 'ACTIVE'}
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div>Coupon Code: <span className="font-mono font-semibold text-gray-900">{redemption.couponCode}</span></div>
                              <div>Points Used: <span className="font-semibold">{redemption.pointsUsed}</span></div>
                              <div>Redeemed: {new Date(redemption.createdAt).toLocaleDateString()}</div>
                              <div>Expires: {new Date(redemption.expiresAt).toLocaleDateString()}</div>
                              {redemption.isUsed && redemption.usedAt && (
                                <div>Used: {new Date(redemption.usedAt).toLocaleDateString()}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            {!redemption.isUsed && new Date(redemption.expiresAt) > new Date() && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(redemption.couponCode);
                                  alert('Coupon code copied to clipboard!');
                                }}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Copy Code
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {reward?.terms && (
                          <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-600">
                            <strong>Terms:</strong> {reward.terms}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* How to Earn Points */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Earn More Points 💡</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-medium text-gray-900 mb-1">Submit Reports</h3>
            <p className="text-sm text-gray-600">Earn 10-50 points for each waste report you submit</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="font-medium text-gray-900 mb-1">Complete Verification</h3>
            <p className="text-sm text-gray-600">Get bonus points when your reports are verified</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">🏆</div>
            <h3 className="font-medium text-gray-900 mb-1">Quality Reports</h3>
            <p className="text-sm text-gray-600">High-quality reports with clear photos earn more points</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;