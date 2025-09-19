import { User, Report, DashboardStats } from '../types';

// Mock Users Data
export const mockUsers: User[] = [
  {
    _id: 'citizen_1',
    name: 'John Doe',
    email: 'citizen@demo.com',
    phone: '+1234567890',
    role: 'citizen',
    points: 150,
    totalReports: 12,
    completedReports: 8,
    reportsSubmitted: 12,
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z'
  },
  {
    _id: 'admin_1',
    name: 'Admin User',
    email: 'admin@demo.com',
    phone: '+1234567891',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-20T12:00:00Z'
  },
  {
    _id: 'collector_1',
    name: 'Mike Wilson',
    email: 'collector@demo.com',
    phone: '+1234567892',
    role: 'collector',
    isAvailable: true,
    assignedReports: ['report_1', 'report_3'],
    status: 'active',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z'
  },
  {
    _id: 'citizen_2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+1234567893',
    role: 'citizen',
    points: 89,
    totalReports: 6,
    completedReports: 4,
    reportsSubmitted: 6,
    status: 'active',
    createdAt: '2024-01-12T11:00:00Z',
    updatedAt: '2024-01-19T16:00:00Z'
  },
  {
    _id: 'collector_2',
    name: 'David Brown',
    email: 'david@example.com',
    phone: '+1234567894',
    role: 'collector',
    isAvailable: false,
    assignedReports: ['report_2', 'report_4', 'report_5'],
    status: 'active',
    createdAt: '2024-01-08T07:30:00Z',
    updatedAt: '2024-01-20T13:45:00Z'
  }
];

// Mock Reports Data
export const mockReports: Report[] = [
  {
    _id: '1',
    reportId: 'WR-2024-001',
    citizenId: '1',
    citizenName: 'John Doe',
    citizenEmail: 'john@example.com',
    location: {
      type: 'Point',
      coordinates: [14.5995, 120.9842],
      address: '123 Main St, Manila, Philippines'
    },
    images: ['/api/placeholder/400/300'],
    description: 'Large pile of mixed waste dumped near the river. Includes plastic bottles, food containers, and organic waste.',
    wasteType: 'mixed',
    status: 'completed',
    assignedTo: '3',
    assignedToName: 'Mike Wilson',
    pointsAwarded: 50,
    priority: 'high',
    statusHistory: [],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
  },
  {
    _id: '2',
    reportId: 'WR-2024-002',
    citizenId: '2',
    citizenName: 'Jane Smith',
    citizenEmail: 'jane@example.com',
    location: {
      type: 'Point',
      coordinates: [14.6042, 120.9822],
      address: '456 Oak Ave, Quezon City, Philippines'
    },
    images: ['/api/placeholder/400/300'],
    description: 'Overflowing garbage bin attracting pests and creating unsanitary conditions.',
    wasteType: 'organic',
    status: 'in_progress',
    assignedTo: '3',
    assignedToName: 'Mike Wilson',
    priority: 'medium',
    statusHistory: [],
    createdAt: '2024-01-16T14:15:00Z',
    updatedAt: '2024-01-17T09:45:00Z'
  },
  {
    _id: '3',
    reportId: 'WR-2024-003',
    citizenId: '1',
    citizenName: 'John Doe',
    citizenEmail: 'john@example.com',
    location: {
      type: 'Point',
      coordinates: [14.5505, 121.0345],
      address: '789 Pine St, Makati, Philippines'
    },
    images: ['/api/placeholder/400/300'],
    description: 'Illegal dumping of construction debris blocking the sidewalk.',
    wasteType: 'construction',
    status: 'verified',
    priority: 'medium',
    statusHistory: [],
    createdAt: '2024-01-17T08:30:00Z',
    updatedAt: '2024-01-17T12:00:00Z'
  },
  {
    _id: '4',
    reportId: 'WR-2024-004',
    citizenId: '2',
    citizenName: 'Jane Smith',
    citizenEmail: 'jane@example.com',
    location: {
      type: 'Point',
      coordinates: [14.6760, 121.0437],
      address: '321 Elm St, Pasig, Philippines'
    },
    images: ['/api/placeholder/400/300'],
    description: 'Scattered plastic waste in the park area, needs immediate cleanup.',
    wasteType: 'plastic',
    status: 'submitted',
    priority: 'low',
    statusHistory: [],
    createdAt: '2024-01-18T16:20:00Z',
    updatedAt: '2024-01-18T16:20:00Z'
  },
  {
    _id: '5',
    reportId: 'WR-2024-005',
    citizenId: '1',
    citizenName: 'John Doe',
    citizenEmail: 'john@example.com',
    location: {
      type: 'Point',
      coordinates: [14.5764, 121.0851],
      address: '654 Maple Ave, Taguig, Philippines'
    },
    images: ['/api/placeholder/400/300'],
    description: 'Electronic waste improperly disposed of in residential area.',
    wasteType: 'electronic',
    status: 'completed',
    assignedTo: '3',
    assignedToName: 'Mike Wilson',
    pointsAwarded: 30,
    completedAt: new Date('2024-01-19T14:00:00Z'),
    priority: 'medium',
    statusHistory: [],
    createdAt: '2024-01-18T09:15:00Z',
    updatedAt: '2024-01-19T14:00:00Z'
  }
];

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalReports: 5,
  pendingReports: 1,
  inProgressReports: 1,
  completedReports: 2,
  rejectedReports: 0,
  totalUsers: 5,
  totalCollectors: 2,
  totalPoints: 140
};

// Mock Rewards Data
export const mockRewards = [
  {
    _id: 'reward_1',
    userId: 'citizen_1',
    reportId: 'report_5',
    points: 30,
    type: 'report_completion',
    description: 'Report WR-2024-005 completed successfully',
    createdAt: '2024-01-19T14:00:00Z'
  },
  {
    _id: 'reward_2',
    userId: 'citizen_1',
    reportId: 'report_1',
    points: 25,
    type: 'report_verified',
    description: 'Report WR-2024-001 verified and assigned',
    createdAt: '2024-01-16T09:00:00Z'
  },
  {
    _id: 'reward_3',
    userId: 'citizen_2',
    points: 50,
    type: 'milestone',
    description: 'Reached 5 reports milestone',
    createdAt: '2024-01-18T16:30:00Z'
  }
];

// Mock Notifications
export const mockNotifications = [
  {
    _id: 'notif_1',
    userId: 'citizen_1',
    title: 'Report Update',
    message: 'Your report WR-2024-001 has been assigned to a collector',
    type: 'report_update',
    read: false,
    createdAt: '2024-01-16T09:00:00Z'
  },
  {
    _id: 'notif_2',
    userId: 'citizen_1',
    title: 'Reward Earned',
    message: 'You earned 30 points for report WR-2024-005',
    type: 'reward',
    read: false,
    createdAt: '2024-01-19T14:00:00Z'
  },
  {
    _id: 'notif_3',
    userId: 'collector_1',
    title: 'New Assignment',
    message: 'You have been assigned report WR-2024-001',
    type: 'assignment',
    read: true,
    createdAt: '2024-01-16T09:00:00Z'
  }
];

// Helper functions to simulate API delays
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate unique IDs
export const generateId = () => Math.random().toString(36).substr(2, 9);