import React, { useState, useEffect } from 'react';
import { Report, User } from '../../types';

interface ReportFilters {
  status: string;
  wasteType: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

const ReportManagement: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [collectors, setCollectors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    status: '',
    wasteType: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const wasteTypes = ['Plastic', 'Paper', 'Glass', 'Metal', 'Organic', 'Electronic', 'Hazardous', 'Mixed'];
  const statuses = ['pending', 'verified', 'assigned', 'in-progress', 'completed', 'rejected'];

  useEffect(() => {
    fetchReports();
    fetchCollectors();
  }, [filters]);

  const fetchReports = () => {
    // Mock reports data
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
        status: 'submitted',
        priority: 'high',
        statusHistory: [],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
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
        description: 'Overflowing recycling bins',
        wasteType: 'recyclable',
        status: 'verified',
        priority: 'medium',
        statusHistory: [],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '3',
        reportId: 'WR-2024-003',
        citizenId: 'citizen_3',
        citizenName: 'Mike Johnson',
        citizenEmail: 'mike@example.com',
        location: {
          type: 'Point',
          coordinates: [-74.008, 40.7130],
          address: '789 Pine St, New York, NY'
        },
        images: ['/api/placeholder/400/300'],
        description: 'Electronic waste dumped illegally',
        wasteType: 'electronic',
        status: 'assigned',
        priority: 'high',
        statusHistory: [],
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    setReports(mockReports);
    setLoading(false);
  };

  const fetchCollectors = () => {
    // Mock collectors data
    const mockCollectors: User[] = [
      {
        _id: 'collector_1',
        name: 'Alex Wilson',
        email: 'alex@example.com',
        role: 'collector',
        phone: '+1234567890',
        points: 0,
        totalReports: 25,
        completedReports: 23,
        reportsSubmitted: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'collector_2',
        name: 'Sarah Davis',
        email: 'sarah@example.com',
        role: 'collector',
        phone: '+1234567891',
        points: 0,
        totalReports: 18,
        completedReports: 16,
        reportsSubmitted: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    setCollectors(mockCollectors);
  };

  const handleStatusUpdate = (reportId: string, newStatus: 'verified' | 'assigned' | 'completed' | 'rejected' | 'submitted' | 'in_progress') => {
    // Mock status update - update local state
    setReports(prevReports => 
      prevReports.map(report => 
        report._id === reportId 
          ? { ...report, status: newStatus, updatedAt: new Date().toISOString() }
          : report
      )
    );
  };

  const handleAssignCollector = (collectorId: string) => {
    if (!selectedReport) return;

    // Mock assignment - update local state
    const collector = collectors.find(c => c._id === collectorId);
    setReports(prevReports => 
      prevReports.map(report => 
        report._id === selectedReport._id 
          ? { 
              ...report, 
              status: 'assigned',
              assignedCollector: collector?.name,
              updatedAt: new Date().toISOString()
            }
          : report
      )
    );
    
    setShowAssignModal(false);
    setSelectedReport(null);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'status-pending',
      verified: 'status-verified',
      assigned: 'status-assigned',
      'in-progress': 'status-in-progress',
      completed: 'status-completed',
      rejected: 'status-rejected'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'status-pending';
  };

  const getPriorityBadge = (priority: string) => {
    const priorityClasses = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return priorityClasses[priority as keyof typeof priorityClasses] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Report Management</h1>
        <button
          onClick={fetchReports}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="form-label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="form-input"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Waste Type</label>
              <select
                value={filters.wasteType}
                onChange={(e) => setFilters({ ...filters, wasteType: e.target.value })}
                className="form-input"
              >
                <option value="">All Types</option>
                {wasteTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Search</label>
              <input
                type="text"
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{report.wasteType}</p>
                          <p className="text-sm text-gray-500">
                            By: {report.citizenName || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.location.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`${getStatusBadge(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(report.priority)}`}>
                          {report.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.assignedToName || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {report.status === 'submitted' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(report._id, 'verified')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(report._id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {report.status === 'verified' && !report.assignedTo && (
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowAssignModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Assign
                          </button>
                        )}
                        <button className="text-gray-600 hover:text-gray-900">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reports.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No reports found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assign Collector Modal */}
      {showAssignModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Collector
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Report: {selectedReport.wasteType} at {selectedReport.location.address}
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {collectors.map((collector) => (
                  <button
                    key={collector._id}
                    onClick={() => handleAssignCollector(collector._id)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <p className="font-medium">{collector.name}</p>
                    <p className="text-sm text-gray-600">{collector.email}</p>
                    <p className="text-xs text-gray-500">
                      Phone: {collector.phone}
                    </p>
                  </button>
                ))}
                {collectors.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No available collectors
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedReport(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;