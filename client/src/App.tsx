import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleBasedRedirect from './components/common/RoleBasedRedirect';
import Layout from './components/common/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import CitizenDashboard from './components/citizen/CitizenDashboard';
import ReportForm from './components/citizen/ReportForm';
import RewardsPage from './components/citizen/RewardsPage';
import AdminDashboard from './components/admin/Dashboard';
import ReportManagement from './components/admin/ReportManagement';
import UserManagement from './components/admin/UserManagement';
import CollectorDashboard from './components/collector/CollectorDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />
            
            {/* Citizen Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <Layout>
                    <CitizenDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/citizen/report"
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <Layout>
                    <ReportForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/citizen/rewards"
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <Layout>
                    <RewardsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/report"
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <Layout>
                    <ReportForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <ReportManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Collector Routes */}
            <Route
              path="/collector"
              element={
                <ProtectedRoute allowedRoles={['collector']}>
                  <Layout>
                    <CollectorDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Catch all route */}
            <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;