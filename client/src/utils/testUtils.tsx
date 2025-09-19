import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Mock data generators
export const mockUser = {
  admin: {
    _id: 'admin_123',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  collector: {
    _id: 'collector_123',
    name: 'John Collector',
    email: 'collector@example.com',
    role: 'collector',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  citizen: {
    _id: 'citizen_123',
    name: 'Jane Citizen',
    email: 'citizen@example.com',
    role: 'citizen',
    isActive: true,
    points: 150,
    reportsSubmitted: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

export const mockReport = {
  _id: 'report_123',
  description: 'Illegal dumping of construction waste',
  wasteType: 'construction',
  location: {
    type: 'Point',
    coordinates: [-74.006, 40.7128],
    address: '123 Main St, New York, NY'
  },
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg'
  ],
  status: 'submitted',
  priority: 'medium',
  submittedBy: 'citizen_123',
  assignedTo: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const mockReward = {
  _id: 'reward_123',
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
};

export const mockNotification = {
  _id: 'notif_123',
  userId: 'citizen_123',
  type: 'report_status',
  title: 'Report Status Updated',
  message: 'Your waste report has been approved and is now being processed.',
  isRead: false,
  actionUrl: '/reports/report_123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Mock API responses
export const mockApiResponses = {
  auth: {
    login: {
      success: true,
      token: 'mock_jwt_token',
      user: mockUser.citizen
    },
    register: {
      success: true,
      message: 'User registered successfully',
      user: mockUser.citizen
    }
  },
  reports: {
    list: {
      success: true,
      reports: [mockReport],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
        hasNext: false,
        hasPrev: false
      }
    },
    create: {
      success: true,
      message: 'Report submitted successfully',
      report: mockReport
    },
    update: {
      success: true,
      message: 'Report updated successfully',
      report: { ...mockReport, status: 'approved' }
    }
  },
  rewards: {
    list: {
      success: true,
      rewards: [mockReward],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 1
      }
    },
    redeem: {
      success: true,
      message: 'Reward redeemed successfully',
      redemption: {
        _id: 'redemption_123',
        userId: 'citizen_123',
        rewardId: 'reward_123',
        pointsUsed: 100,
        redeemedAt: new Date().toISOString()
      }
    }
  },
  notifications: {
    list: {
      success: true,
      notifications: [mockNotification],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 1,
        unreadCount: 1
      }
    }
  },
  analytics: {
    dashboard: {
      success: true,
      data: {
        totalReports: 150,
        pendingReports: 25,
        activeUsers: 75,
        totalRewards: 12,
        recentReports: [mockReport],
        reportsByStatus: {
          pending: 25,
          approved: 50,
          'in-progress': 30,
          completed: 40,
          rejected: 5
        },
        reportsByType: {
          organic: 40,
          recyclable: 35,
          hazardous: 15,
          electronic: 20,
          construction: 25,
          other: 15
        }
      }
    }
  }
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: any } {
  const {
    initialEntries = ['/'],
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  const user = userEvent;

  return {
    user,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Mock fetch function
export const mockFetch = (responses: Record<string, any>) => {
  global.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    const key = `${method} ${url}`;
    
    const response = responses[key] || responses[url];
    
    if (!response) {
      return Promise.reject(new Error(`No mock response for ${key}`));
    }
    
    return Promise.resolve({
      ok: response.ok !== false,
      status: response.status || 200,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    } as Response);
  });
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
    },
    writable: true,
  });
};

// Mock geolocation
export const mockGeolocation = () => {
  const mockGeolocation = {
    getCurrentPosition: jest.fn((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
      });
    }),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  };

  Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
  });

  return mockGeolocation;
};

// Mock file upload
export const createMockFile = (name: string, type: string, size: number = 1024) => {
  const file = new File(['mock file content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Test helpers
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const expectElementToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument();
};

export const expectElementNotToBeInDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeInTheDocument();
};

// Custom matchers
expect.extend({
  toHaveFormData(received: FormData, expected: Record<string, any>) {
    const pass = Object.entries(expected).every(([key, value]) => {
      const formValue = received.get(key);
      return formValue === value;
    });

    return {
      message: () =>
        pass
          ? `Expected FormData not to have ${JSON.stringify(expected)}`
          : `Expected FormData to have ${JSON.stringify(expected)}`,
      pass,
    };
  },
});

// Test data factories
export const createMockUsers = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockUser.citizen,
    _id: `user_${index + 1}`,
    name: `User ${index + 1}`,
    email: `user${index + 1}@example.com`,
  }));
};

export const createMockReports = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockReport,
    _id: `report_${index + 1}`,
    description: `Report ${index + 1} description`,
  }));
};

export const createMockRewards = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockReward,
    _id: `reward_${index + 1}`,
    title: `Reward ${index + 1}`,
    pointsCost: 50 + (index * 25),
  }));
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  await waitForLoadingToFinish();
  const end = performance.now();
  return end - start;
};

// Accessibility testing helpers
export const checkAccessibility = async (container: HTMLElement) => {
  // Note: @axe-core/react is not installed, so we'll provide a mock implementation
  console.warn('Accessibility testing is not available - @axe-core/react is not installed');
  return { violations: [] };
};

// Export everything for easy importing
export * from '@testing-library/react';
export * from '@testing-library/jest-dom';
export { userEvent };