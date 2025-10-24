import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import LoadingAtom from './components/LoadingAtom';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Branches from './pages/Branches';
import Schools from './pages/Schools';
import Students from './pages/Students';
import InactiveStudents from './pages/InactiveStudents';
import Instructors from './pages/Instructors';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import MyOrders from './pages/MyOrders';
import Orders from './pages/Orders';
import UserProfile from './pages/UserProfile';
import Announcements from './pages/Announcements';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import ErrorPage from './pages/ErrorPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingAtom size="medium" />
        <p>Loading application...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/branches" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Branches />
            </ProtectedRoute>
          } />
          <Route path="/schools" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Schools />
            </ProtectedRoute>
          } />
          <Route path="/students" element={<Students />} />
          <Route path="/students/inactive" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <InactiveStudents />
            </ProtectedRoute>
          } />
          <Route path="/instructors" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Instructors />
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/inventory" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="/products" element={<Products />} />
          <Route path="/my-orders" element={
            <ProtectedRoute allowedRoles={['instructor']}>
              <MyOrders />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['admin', 'instructor']}>
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path="/announcements" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Announcements />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute allowedRoles={['instructor']}>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="App">
              <AppRoutes />
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                toastClassName="custom-toast"
                bodyClassName="custom-toast-body"
              />
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
