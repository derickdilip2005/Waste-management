import { ApiResponse, User, Report, DashboardStats } from '../types';
import { 
  mockUsers, 
  mockReports, 
  mockDashboardStats, 
  mockRewards, 
  mockNotifications, 
  delay, 
  generateId 
} from './mockData';

// Mock storage to simulate database
let users = [...mockUsers];
let reports = [...mockReports];
let rewards = [...mockRewards];
let notifications = [...mockNotifications];

// Mock Authentication API
export const mockAuthAPI = {
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    await delay(800); // Simulate network delay
    
    const user = users.find(u => u.email === email);
    if (!user || password !== 'password123') {
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }

    const token = `mock_token_${user._id}_${Date.now()}`;
    return {
      success: true,
      message: 'Login successful',
      data: { token, user }
    };
  },

  register: async (userData: Partial<User>): Promise<ApiResponse<{ token: string; user: User }>> => {
    await delay(1000);
    
    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
      return {
        success: false,
        error: 'User already exists with this email'
      };
    }

    const newUser: User = {
      _id: generateId(),
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone,
      role: userData.role || 'citizen',
      points: 0,
      totalReports: 0,
      completedReports: 0,
      reportsSubmitted: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);
    const token = `mock_token_${newUser._id}_${Date.now()}`;
    
    return {
      success: true,
      message: 'Registration successful',
      data: { token, user: newUser }
    };
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    await delay(500);
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const userId = token.split('_')[2];
    const user = users.find(u => u._id === userId);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, data: user };
  },

  updateProfile: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    await delay(800);
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const userId = token.split('_')[2];
    const userIndex = users.findIndex(u => u._id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }

    users[userIndex] = { ...users[userIndex], ...userData, updatedAt: new Date().toISOString() };
    return { success: true, data: users[userIndex] };
  }
};

// Mock Reports API
export const mockReportsAPI = {
  submitReport: async (reportData: FormData): Promise<ApiResponse<Report>> => {
    await delay(1200);
    
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const userId = token.split('_')[2];
    const user = users.find(u => u._id === userId);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const newReport: Report = {
      _id: generateId(),
      reportId: `WR-2024-${String(reports.length + 1).padStart(3, '0')}`,
      citizenId: user._id,
      citizenName: user.name,
      citizenEmail: user.email,
      location: {
        type: 'Point',
        coordinates: [-74.006 + Math.random() * 0.1, 40.7128 + Math.random() * 0.1],
        address: reportData.get('address') as string || 'Unknown Address'
      },
      images: ['/api/placeholder/400/300'], // Mock image URLs
      description: reportData.get('description') as string || '',
      wasteType: reportData.get('wasteType') as string || 'household',
      status: 'submitted',
      priority: 'medium',
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reports.push(newReport);
    
    // Update user stats
    const userIndex = users.findIndex(u => u._id === userId);
    if (userIndex !== -1) {
      users[userIndex].reportsSubmitted = (users[userIndex].reportsSubmitted || 0) + 1;
      users[userIndex].totalReports = (users[userIndex].totalReports || 0) + 1;
    }

    return {
      success: true,
      message: 'Report submitted successfully',
      data: newReport
    };
  },

  getReports: async (params?: any): Promise<ApiResponse<Report[]>> => {
    await delay(600);
    
    let filteredReports = [...reports];
    
    if (params?.citizenId) {
      filteredReports = filteredReports.filter(r => r.citizenId === params.citizenId);
    }
    
    if (params?.assignedTo) {
      filteredReports = filteredReports.filter(r => r.assignedTo === params.assignedTo);
    }
    
    if (params?.status) {
      filteredReports = filteredReports.filter(r => r.status === params.status);
    }

    return {
      success: true,
      data: filteredReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
  },

  getReport: async (id: string): Promise<ApiResponse<Report>> => {
    await delay(400);
    
    const report = reports.find(r => r._id === id);
    if (!report) {
      return { success: false, error: 'Report not found' };
    }

    return { success: true, data: report };
  },

  updateReport: async (id: string, updateData: Partial<Report>): Promise<ApiResponse<Report>> => {
    await delay(800);
    
    const reportIndex = reports.findIndex(r => r._id === id);
    if (reportIndex === -1) {
      return { success: false, error: 'Report not found' };
    }

    reports[reportIndex] = { 
      ...reports[reportIndex], 
      ...updateData, 
      updatedAt: new Date().toISOString() 
    };

    return { success: true, data: reports[reportIndex] };
  },

  deleteReport: async (id: string): Promise<ApiResponse<void>> => {
    await delay(500);
    
    const reportIndex = reports.findIndex(r => r._id === id);
    if (reportIndex === -1) {
      return { success: false, error: 'Report not found' };
    }

    reports.splice(reportIndex, 1);
    return { success: true, message: 'Report deleted successfully' };
  }
};

// Mock Users API
export const mockUsersAPI = {
  getUsers: async (params?: any): Promise<ApiResponse<User[]>> => {
    await delay(600);
    
    let filteredUsers = [...users];
    
    if (params?.role) {
      filteredUsers = filteredUsers.filter(u => u.role === params.role);
    }
    
    if (params?.status) {
      filteredUsers = filteredUsers.filter(u => u.status === params.status);
    }

    return { success: true, data: filteredUsers };
  },

  getUser: async (id: string): Promise<ApiResponse<User>> => {
    await delay(400);
    
    const user = users.find(u => u._id === id);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, data: user };
  },

  updateUser: async (id: string, updateData: Partial<User>): Promise<ApiResponse<User>> => {
    await delay(800);
    
    const userIndex = users.findIndex(u => u._id === id);
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }

    users[userIndex] = { 
      ...users[userIndex], 
      ...updateData, 
      updatedAt: new Date().toISOString() 
    };

    return { success: true, data: users[userIndex] };
  },

  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    await delay(500);
    
    const userIndex = users.findIndex(u => u._id === id);
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }

    users.splice(userIndex, 1);
    return { success: true, message: 'User deleted successfully' };
  }
};

// Mock Analytics API
export const mockAnalyticsAPI = {
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    await delay(700);
    
    const stats: DashboardStats = {
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'submitted').length,
      inProgressReports: reports.filter(r => r.status === 'in_progress').length,
      completedReports: reports.filter(r => r.status === 'completed').length,
      rejectedReports: reports.filter(r => r.status === 'rejected').length,
      totalUsers: users.length,
      totalCollectors: users.filter(u => u.role === 'collector').length,
      totalPoints: rewards.reduce((sum, r) => sum + r.points, 0)
    };

    return { success: true, data: stats };
  }
};

// Mock Rewards API
export const mockRewardsAPI = {
  getUserRewards: async (userId: string): Promise<ApiResponse<typeof rewards>> => {
    await delay(500);
    
    const userRewards = rewards.filter(r => r.userId === userId);
    return { success: true, data: userRewards };
  },

  getAllRewards: async (): Promise<ApiResponse<typeof rewards>> => {
    await delay(600);
    return { success: true, data: rewards };
  }
};

// Mock Notifications API
export const mockNotificationsAPI = {
  getUserNotifications: async (userId: string): Promise<ApiResponse<typeof notifications>> => {
    await delay(400);
    
    const userNotifications = notifications.filter(n => n.userId === userId);
    return { success: true, data: userNotifications };
  },

  markAsRead: async (notificationId: string): Promise<ApiResponse<void>> => {
    await delay(300);
    
    const notificationIndex = notifications.findIndex(n => n._id === notificationId);
    if (notificationIndex !== -1) {
      notifications[notificationIndex].read = true;
    }
    
    return { success: true, message: 'Notification marked as read' };
  }
};

// Export all mock APIs
export const mockAPI = {
  auth: mockAuthAPI,
  reports: mockReportsAPI,
  users: mockUsersAPI,
  analytics: mockAnalyticsAPI,
  rewards: mockRewardsAPI,
  notifications: mockNotificationsAPI
};