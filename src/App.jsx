import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './styles/components.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
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
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
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
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
