export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'citizen' | 'admin' | 'collector';
  points?: number;
  totalReports?: number;
  completedReports?: number;
  reportsSubmitted?: number;
  isAvailable?: boolean;
  assignedReports?: string[];
  status?: 'active' | 'suspended' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  _id: string;
  reportId: string;
  citizenId: string;
  citizenName: string;
  citizenEmail: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  images: string[];
  description: string;
  wasteType: string;
  mlClassification?: {
    isWaste: boolean;
    confidence: number;
    wasteType?: string;
    processedAt: Date;
  };
  status: 'submitted' | 'verified' | 'assigned' | 'in_progress' | 'completed' | 'rejected';
  assignedTo?: string;
  assignedToName?: string;
  collectorImages?: {
    before?: string[];
    after?: string[];
  };
  collectorNotes?: string;
  pointsAwarded?: number;
  priority: 'low' | 'medium' | 'high';
  verifiedAt?: Date;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    updatedBy: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Reward {
  _id: string;
  title: string;
  description: string;
  pointsRequired: number;
  type: 'coupon' | 'discount' | 'gift';
  value: number;
  isActive: boolean;
  availableQuantity: number;
  validUntil: Date;
  partnerName?: string;
  partnerLogo?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Redemption {
  _id: string;
  userId: string;
  rewardId: string;
  couponCode: string;
  pointsUsed: number;
  isUsed: boolean;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateUser: (userData: Partial<User>) => void;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'citizen' | 'admin' | 'collector';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ReportFormData {
  description: string;
  wasteType: string;
  images: File[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  completedReports: number;
  rejectedReports: number;
  totalPoints?: number;
  totalUsers?: number;
  totalCollectors?: number;
}

export interface AnalyticsData {
  reportsTimeline: Array<{
    date: string;
    count: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  wasteTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  hotspots: Array<{
    location: {
      coordinates: [number, number];
      address?: string;
    };
    count: number;
  }>;
  topCitizens: Array<{
    userId: string;
    name: string;
    points: number;
    reportsCount: number;
  }>;
  collectorPerformance: Array<{
    collectorId: string;
    name: string;
    completedReports: number;
    averageTime: number;
    rating: number;
  }>;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  updatedAt: string;
}