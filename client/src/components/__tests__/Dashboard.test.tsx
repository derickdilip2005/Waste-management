import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApiResponses, mockFetch } from '../../utils/testUtils';
import Dashboard from '../admin/Dashboard';

// Mock the API client
jest.mock('../../services/api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful API responses
    mockFetch({
      '/api/analytics/dashboard': mockApiResponses.analytics.dashboard,
    });
  });

  it('renders dashboard with loading state initially', () => {
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
  });

  it('displays dashboard data after loading', async () => {
    renderWithProviders(<Dashboard />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
    });

    // Check if main dashboard elements are rendered
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Reports')).toBeInTheDocument();
    expect(screen.getByText('Pending Reports')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('Total Rewards')).toBeInTheDocument();
  });

  it('displays correct statistics from API', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
    });

    // Check if the correct numbers are displayed
    expect(screen.getByText('150')).toBeInTheDocument(); // Total Reports
    expect(screen.getByText('25')).toBeInTheDocument();  // Pending Reports
    expect(screen.getByText('75')).toBeInTheDocument();  // Active Users
    expect(screen.getByText('12')).toBeInTheDocument();  // Total Rewards
  });

  it('displays recent reports section', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Recent Reports')).toBeInTheDocument();
    expect(screen.getByText('Illegal dumping of construction waste')).toBeInTheDocument();
  });

  it('displays reports by status chart', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Reports by Status')).toBeInTheDocument();
    // Check for status labels
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays reports by type chart', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Reports by Type')).toBeInTheDocument();
    // Check for waste type labels
    expect(screen.getByText('Organic')).toBeInTheDocument();
    expect(screen.getByText('Recyclable')).toBeInTheDocument();
    expect(screen.getByText('Hazardous')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    // Mock API error
    mockFetch({
      '/api/analytics/dashboard': {
        ok: false,
        status: 500,
        message: 'Internal server error',
      },
    });

    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard data')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load dashboard data. Please try again.')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('allows retrying after error', async () => {
    // Mock initial error, then success
    let callCount = 0;
    global.fetch = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Internal server error' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponses.analytics.dashboard),
      } as Response);
    });

    const { user } = renderWithProviders(<Dashboard />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard data')).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByText('Retry');
    await user.click(retryButton);

    // Wait for successful load
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    expect(screen.queryByText('Error loading dashboard data')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
    });

    // Check for proper headings
    const mainHeading = screen.getByRole('heading', { name: 'Admin Dashboard' });
    expect(mainHeading).toBeInTheDocument();

    // Check for proper regions
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    // Check for proper button accessibility
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type');
    });
  });

  it('updates data when component remounts', async () => {
    const { rerender } = renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
    });

    // Mock updated data
    mockFetch({
      '/api/analytics/dashboard': {
        ...mockApiResponses.analytics.dashboard,
        data: {
          ...mockApiResponses.analytics.dashboard.data,
          totalReports: 200, // Updated value
        },
      },
    });

    // Remount component
    rerender(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('200')).toBeInTheDocument(); // Updated total reports
    });
  });

  it('displays loading state for charts', async () => {
    renderWithProviders(<Dashboard />);
    
    // Initially should show loading
    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
    });

    // Charts should be rendered
    expect(screen.getByText('Reports by Status')).toBeInTheDocument();
    expect(screen.getByText('Reports by Type')).toBeInTheDocument();
  });

  it('handles empty data gracefully', async () => {
    // Mock empty response
    mockFetch({
      '/api/analytics/dashboard': {
        success: true,
        data: {
          totalReports: 0,
          pendingReports: 0,
          activeUsers: 0,
          totalRewards: 0,
          recentReports: [],
          reportsByStatus: {},
          reportsByType: {},
        },
      },
    });

    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
    });

    // Should display zeros
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('No recent reports')).toBeInTheDocument();
  });
});