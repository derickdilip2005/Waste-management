import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Report } from '../../types';

interface CollectorStats {
  assignedReports: number;
  inProgressReports: number;
  completedReports: number;
  totalPoints: number;
}

const CollectorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CollectorStats | null>(null);
  const [assignedReports, setAssignedReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCollectorData();
  }, []);

  const fetchCollectorData = () => {
    // Mock data for collector dashboard
    const mockStats: CollectorStats = {
      assignedReports: 8,
      inProgressReports: 3,
      completedReports: 25,
      totalPoints: 750
    };

    const mockReports: Report[] = [
      {
        _id: '1',
        reportId: 'WR-2024-001',
        citizenId: 'citizen_1',
        citizenName: 'John Doe',
        citizenEmail: 'john@example.com',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128],
          address: '123 Main St, New York, NY'
        },
        images: ['/api/placeholder/400/300'],
        description: 'Large pile of household waste on sidewalk',
        wasteType: 'household',
        status: 'assigned',
        priority: 'high',
        statusHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        reportId: 'WR-2024-002',
        citizenId: 'citizen_2',
        citizenName: 'Jane Smith',
        citizenEmail: 'jane@example.com',
        location: {
          type: 'Point',
          coordinates: [-74.007, 40.7129],
          address: '456 Oak Ave, New York, NY'
        },
        images: ['/api/placeholder/400/300'],
        description: 'Overflowing recycling bin',
        wasteType: 'recyclable',
        status: 'assigned',
        priority: 'medium',
        statusHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    setStats(mockStats);
    setAssignedReports(mockReports);
    setLoading(false);
  };

  const handleStartWork = (reportId: string) => {
    // Mock updating report status
    setAssignedReports(prev => 
      prev.map(report => 
        report._id === reportId 
          ? { ...report, status: 'in_progress' as const }
          : report
      )
    );
    
    // Update stats
    if (stats) {
      setStats({
        ...stats,
        assignedReports: stats.assignedReports - 1,
        inProgressReports: stats.inProgressReports + 1
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchCollectorData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">Here are your waste collection assignments for today.</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assigned Reports</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.assignedReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.inProgressReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Points Earned</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPoints}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Reports */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Assignments</h2>
        </div>
        <div className="p-6">
          {assignedReports.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any waste collection assignments at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedReports.map((report) => (
                <div key={report._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">#{report.reportId}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          report.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {report.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          report.priority === 'high' ? 'bg-red-100 text-red-800' :
                          report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {report.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>📍 {report.location.address || 'Location provided'}</span>
                        <span>🗑️ {report.wasteType}</span>
                        <span>👤 {report.citizenName}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      {report.status === 'assigned' && (
                        <button
                          onClick={() => handleStartWork(report._id)}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Start Work
                        </button>
                      )}
                      {report.status === 'in_progress' && (
                        <button
                          onClick={() => window.location.href = `/collector/report/${report._id}`}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Continue Work
                        </button>
                      )}
                      <button
                        onClick={() => window.location.href = `/collector/report/${report._id}`}
                        className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectorDashboard;