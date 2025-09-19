import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Report, DashboardStats } from '../../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = () => {
    // Mock data for citizen dashboard
    const mockReports: Report[] = [
      {
        _id: '1',
        reportId: 'WR-2024-001',
        citizenId: user?._id || 'citizen_1',
        citizenName: user?.name || 'Demo User',
        citizenEmail: user?.email || 'demo@example.com',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128],
          address: '123 Main St, New York, NY'
        },
        images: ['/api/placeholder/400/300'],
        description: 'Household waste pile on sidewalk',
        wasteType: 'household',
        status: 'completed',
        priority: 'medium',
        statusHistory: [],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        reportId: 'WR-2024-002',
        citizenId: user?._id || 'citizen_1',
        citizenName: user?.name || 'Demo User',
        citizenEmail: user?.email || 'demo@example.com',
        location: {
          type: 'Point',
          coordinates: [-74.007, 40.7129],
          address: '456 Oak Ave, New York, NY'
        },
        images: ['/api/placeholder/400/300'],
        description: 'Overflowing recycling bin',
        wasteType: 'recyclable',
        status: 'in_progress',
        priority: 'low',
        statusHistory: [],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const mockLeaderboard = [
      { _id: '1', name: 'Alice Johnson', points: 450, totalReports: 15 },
      { _id: '2', name: 'Bob Smith', points: 380, totalReports: 12 },
      { _id: '3', name: user?.name || 'Demo User', points: user?.points || 250, totalReports: 8 },
      { _id: '4', name: 'Carol Davis', points: 220, totalReports: 7 },
      { _id: '5', name: 'David Wilson', points: 180, totalReports: 6 }
    ];

    setRecentReports(mockReports);
    setStats({
      totalReports: mockReports.length,
      pendingReports: mockReports.filter(r => r.status === 'submitted').length,
      inProgressReports: mockReports.filter(r => r.status === 'in_progress').length,
      completedReports: mockReports.filter(r => r.status === 'completed').length,
      rejectedReports: mockReports.filter(r => r.status === 'rejected').length,
      totalPoints: user?.points || 250,
    });
    setLeaderboard(mockLeaderboard);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'verified':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserRank = () => {
    const userIndex = leaderboard.findIndex(u => u.userId === user?._id);
    return userIndex >= 0 ? userIndex + 1 : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Help keep your community clean by reporting waste issues and earning points.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">🏆</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Points
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.totalPoints || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">📋</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Reports
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.totalReports || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">⏳</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.pendingReports || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">📍</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Your Rank
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    #{getUserRank() || 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/citizen/report"
              className="relative group bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📸</span>
                <div>
                  <h4 className="text-white font-medium">Report Waste</h4>
                  <p className="text-blue-100 text-sm">Take a photo and report</p>
                </div>
              </div>
            </Link>

            <Link
              to="/citizen/reports"
              className="relative group bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <h4 className="text-white font-medium">My Reports</h4>
                  <p className="text-green-100 text-sm">View all your reports</p>
                </div>
              </div>
            </Link>

            <Link
              to="/citizen/rewards"
              className="relative group bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🎁</span>
                <div>
                  <h4 className="text-white font-medium">Rewards</h4>
                  <p className="text-purple-100 text-sm">Redeem your points</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reports */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Reports
              </h3>
              <Link
                to="/citizen/reports"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
            {recentReports.length > 0 ? (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {report.reportId}
                      </p>
                      <p className="text-xs text-gray-500">
                        {report.wasteType} • {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        report.status
                      )}`}
                    >
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="text-4xl">📋</span>
                <p className="mt-2 text-sm text-gray-500">
                  No reports yet. Start by reporting a waste issue!
                </p>
                <Link
                  to="/citizen/report"
                  className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  Report Now
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Community Leaderboard 🏆
            </h3>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((citizen, index) => (
                  <div
                    key={citizen.userId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      citizen.userId === user?._id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-3">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {citizen.name}
                          {citizen.userId === user?._id && (
                            <span className="ml-2 text-xs text-blue-600">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {citizen.reportsCount} reports
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {citizen.points} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="text-4xl">🏆</span>
                <p className="mt-2 text-sm text-gray-500">
                  No leaderboard data available yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;