import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';
import { mockAPI } from './mockApi';

// Environment flag to use mock API
const USE_MOCK_API = process.env.REACT_APP_USE_MOCK_API === 'true' || true; // Default to true for frontend-only mode

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(url, { params });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(url, data);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async uploadFile<T>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse<any> {
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        error: error.response.data?.message || error.response.data?.error || 'Server error',
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        error: 'Network error - please check your connection',
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }
}

export const apiClient = new ApiClient();

// Specific API endpoints - with mock API fallback
export const authAPI = {
  login: (email: string, password: string) =>
    USE_MOCK_API ? mockAPI.auth.login(email, password) : apiClient.post('/auth/login', { email, password }),
  
  register: (userData: any) =>
    USE_MOCK_API ? mockAPI.auth.register(userData) : apiClient.post('/auth/register', userData),
  
  getProfile: () =>
    USE_MOCK_API ? mockAPI.auth.getProfile() : apiClient.get('/auth/profile'),
  
  updateProfile: (userData: any) =>
    USE_MOCK_API ? mockAPI.auth.updateProfile(userData) : apiClient.put('/auth/profile', userData),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put('/auth/change-password', { currentPassword, newPassword }),
  
  refreshToken: () =>
    apiClient.post('/auth/refresh'),
  
  logout: () =>
    apiClient.post('/auth/logout'),
};

export const reportsAPI = {
  submitReport: (formData: FormData) =>
    USE_MOCK_API ? mockAPI.reports.submitReport(formData) : apiClient.uploadFile('/reports/submit', formData),
  
  getReports: (params?: any) =>
    USE_MOCK_API ? mockAPI.reports.getReports(params) : apiClient.get('/reports', params),
  
  getReport: (id: string) =>
    USE_MOCK_API ? mockAPI.reports.getReport(id) : apiClient.get(`/reports/${id}`),
  
  updateReportStatus: (id: string, status: string, notes?: string) =>
    apiClient.put(`/reports/${id}/status`, { status, notes }),
  
  verifyReport: (id: string, approved: boolean, reason?: string) =>
    apiClient.put(`/reports/${id}/verify`, { approved, reason }),
  
  assignReport: (id: string, collectorId: string) =>
    apiClient.put(`/reports/${id}/assign`, { collectorId }),
  
  startReport: (id: string, beforeImages: FormData) =>
    apiClient.uploadFile(`/reports/${id}/start`, beforeImages),
  
  completeReport: (id: string, afterImages: FormData, notes?: string) =>
    apiClient.uploadFile(`/reports/${id}/complete`, afterImages),
  
  awardPoints: (id: string, points: number) =>
    apiClient.put(`/reports/${id}/award-points`, { points }),
  
  getNearbyReports: (latitude: number, longitude: number, radius?: number) =>
    apiClient.get('/reports/nearby', { latitude, longitude, radius }),
};

export const usersAPI = {
  getUsers: (params?: any) =>
    USE_MOCK_API ? mockAPI.users.getUsers(params) : apiClient.get('/users', params),
  
  getUser: (id: string) =>
    USE_MOCK_API ? mockAPI.users.getUser(id) : apiClient.get(`/users/${id}`),
  
  updateUserStatus: (id: string, isActive: boolean) =>
    apiClient.put(`/users/${id}/status`, { isActive }),
  
  getRewards: () =>
    apiClient.get('/users/rewards'),
  
  redeemReward: (rewardId: string) =>
    apiClient.post('/users/redeem', { rewardId }),
  
  getRedemptions: () =>
    apiClient.get('/users/redemptions'),
  
  updateCollectorAvailability: (isAvailable: boolean) =>
    apiClient.put('/users/availability', { isAvailable }),
  
  getLeaderboard: (limit?: number) =>
    apiClient.get('/users/leaderboard', { limit }),
  
  adjustPoints: (userId: string, points: number, reason: string) =>
    apiClient.put(`/users/${userId}/points`, { points, reason }),
};

export const analyticsAPI = {
  getDashboardStats: () =>
    USE_MOCK_API ? mockAPI.analytics.getDashboardStats() : apiClient.get('/analytics/dashboard'),
  
  getReportsTimeline: (period?: string) =>
    apiClient.get('/analytics/reports-timeline', { period }),
  
  getStatusDistribution: () =>
    apiClient.get('/analytics/status-distribution'),
  
  getWasteTypes: () =>
    apiClient.get('/analytics/waste-types'),
  
  getHotspots: () =>
    apiClient.get('/analytics/hotspots'),
  
  getTopCitizens: (limit?: number) =>
    apiClient.get('/analytics/top-citizens', { limit }),
  
  getCollectorPerformance: () =>
    apiClient.get('/analytics/collector-performance'),
  
  getRewardsUsage: () =>
    apiClient.get('/analytics/rewards-usage'),
};