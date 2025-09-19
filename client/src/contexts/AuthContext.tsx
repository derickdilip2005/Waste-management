import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthContextType, RegisterData } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const initialState: AuthState = {
  user: null,
  token: null,
  loading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing token on app load
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = (email: string, password: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    return new Promise((resolve) => {
      // Mock login - simulate successful login with demo users
      setTimeout(() => {
        let mockUser: User;
        
        // Define demo users with different roles
        if (email === 'citizen@demo.com') {
          mockUser = {
            _id: '1',
            name: 'Demo Citizen',
            email: email,
            role: 'citizen',
            points: 150,
            phone: '+1234567890',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } else if (email === 'admin@demo.com') {
          mockUser = {
            _id: '2',
            name: 'Demo Admin',
            email: email,
            role: 'admin',
            points: 0,
            phone: '+1234567891',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } else if (email === 'collector@demo.com') {
          mockUser = {
            _id: '3',
            name: 'Demo Collector',
            email: email,
            role: 'collector',
            points: 0,
            phone: '+1234567892',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } else {
          // Default to citizen for any other email
          mockUser = {
            _id: '1',
            name: 'Demo User',
            email: email,
            role: 'citizen',
            points: 150,
            phone: '+1234567890',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        
        const mockToken = 'demo-token-' + Date.now();
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: mockUser, token: mockToken } });
        resolve();
      }, 1000); // Simulate network delay
    });
  };

  const register = (userData: RegisterData): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    return new Promise((resolve) => {
      // Mock registration - simulate successful registration
      setTimeout(() => {
        const mockUser: User = {
          _id: Date.now().toString(),
          name: userData.name,
          email: userData.email,
          role: userData.role || 'citizen',
          points: 0,
          phone: userData.phone || '',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const mockToken = 'demo-token-' + Date.now();
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: mockUser, token: mockToken } });
        resolve();
      }, 1000); // Simulate network delay
    });
  };

  const logout = (): void => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData: Partial<User>): void => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    
    // Update localStorage
    if (state.user) {
      const updatedUser = { ...state.user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user: state.user,
    token: state.token,
    login,
    register,
    logout,
    loading: state.loading,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;