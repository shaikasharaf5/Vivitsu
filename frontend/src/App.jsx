import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import InspectorDashboard from './pages/InspectorDashboard';
import ContractorDashboard from './pages/ContractorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import IssueDetail from './pages/IssueDetail';
import MapView from './pages/MapView';
import AQIMap from './pages/AQIMap';

// Context
import { AuthProvider, useAuth } from './utils/AuthContext';
import { SocketProvider } from './utils/SocketContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  console.log('%c[ProtectedRoute]', 'color: purple', 'user:', user, 'loading:', loading, 'allowedRoles:', allowedRoles);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('[ProtectedRoute] User role not allowed:', user.role, 'allowed:', allowedRoles, '- redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('[ProtectedRoute] Access granted for role:', user.role);
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  const getDashboard = () => {
    if (!user) {
      console.log('getDashboard: No user, redirecting to login');
      return <Navigate to="/login" />;
    }
    
    console.log('getDashboard: User role is', user.role);
    
    // Route to appropriate dashboard based on role
    switch (user.role) {
      case 'SUPER_ADMIN':
        return <SuperAdminDashboard />;
      case 'ADMIN':
        return <AdminDashboard />;
      case 'WORKER':
        return <WorkerDashboard />;
      case 'INSPECTOR':
        return <InspectorDashboard />;
      case 'CONTRACTOR':
        return <ContractorDashboard />;
      case 'CITIZEN':
      default:
        return <CitizenDashboard />;
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes - Main Dashboard */}
      <Route path="/" element={
        <ProtectedRoute>
          {getDashboard()}
        </ProtectedRoute>
      } />
      
      {/* Map View - Available to all authenticated users */}
      <Route path="/map" element={
        <ProtectedRoute>
          <MapView />
        </ProtectedRoute>
      } />
      
      {/* AQI Map - Available to all authenticated users */}
      <Route path="/aqi-map" element={
        <ProtectedRoute>
          <AQIMap />
        </ProtectedRoute>
      } />
      
      {/* Issue Detail - Available to all authenticated users */}
      <Route path="/issue/:id" element={
        <ProtectedRoute>
          <IssueDetail />
        </ProtectedRoute>
      } />
      
      {/* Role-specific Routes */}
      <Route path="/super-admin" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
          <SuperAdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/worker" element={
        <ProtectedRoute allowedRoles={['WORKER']}>
          <WorkerDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/inspector" element={
        <ProtectedRoute allowedRoles={['INSPECTOR']}>
          <InspectorDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/contractor" element={
        <ProtectedRoute allowedRoles={['CONTRACTOR']}>
          <ContractorDashboard />
        </ProtectedRoute>
      } />

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
            <ToastContainer 
              position="top-right" 
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
