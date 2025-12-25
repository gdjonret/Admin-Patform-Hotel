import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout components
import LoadingSpinner from '../components/LoadingSpinner';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminOnly from '../components/AdminOnly';

// Auth pages (not lazy loaded)
import { Login, Signup, ForgotPassword } from '../features/auth';

// Eager loaded pages (critical path)
import { Dashboard } from '../features/dashboard';

// Lazy loaded pages (non-critical path)
const Reservations = lazy(() => import('../features/reservations').then(m => ({ default: m.Reservations })));
const RoomsWithProvider = lazy(() => import('../features/rooms/components/RoomsWithProvider'));
const RoomTypes = lazy(() => import('../features/room-types').then(m => ({ default: m.RoomTypes })));
const Guests = lazy(() => import('../features/guests').then(m => ({ default: m.Guests })));
const Staff = lazy(() => import('../features/staff').then(m => ({ default: m.Staff })));
const Reports = lazy(() => import('../features/reports').then(m => ({ default: m.Reports })));
const HelpDesk = lazy(() => import('../features/helpdesk').then(m => ({ default: m.HelpDesk })));
const Messages = lazy(() => import('../features/messages').then(m => ({ default: m.Messages })));
const Settings = lazy(() => import('../features/settings').then(m => ({ default: m.Settings })));

// Error pages
const NotFound = () => (
  <div className="error-container">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
  </div>
);

/**
 * Main application routes
 * Uses React Router v6 syntax with lazy loading for better performance
 */
function AppRoutes() {
  return (
    <Suspense fallback={<div className="loading-container"><LoadingSpinner /></div>}>
      <Routes>
        {/* Auth routes (public) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
        <Route path="/rooms" element={<ProtectedRoute><RoomsWithProvider /></ProtectedRoute>} />
        <Route path="/room-types" element={<ProtectedRoute><AdminOnly><RoomTypes /></AdminOnly></ProtectedRoute>} />
        <Route path="/guests" element={<ProtectedRoute><Guests /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><AdminOnly><Staff /></AdminOnly></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><AdminOnly><Reports /></AdminOnly></ProtectedRoute>} />
        <Route path="/helpdesk" element={<ProtectedRoute><HelpDesk /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AdminOnly><Settings /></AdminOnly></ProtectedRoute>} />
        
        {/* Health check endpoint */}
        <Route path="/health" element={<div>Health Check OK</div>} />
        
        {/* Redirect legacy paths */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/bookings" element={<Navigate to="/reservations" replace />} />
        
        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
