import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import Closet from './pages/Closet';
import SmartLooks from './pages/SmartLooks';
import ChatAI from './pages/ChatAI';
import Shopping from './pages/Shopping';
import ColorAnalysis from './pages/ColorAnalysis';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="profile-setup" element={<ProfileSetup />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="closet" element={<Closet />} />
              <Route path="looks" element={<SmartLooks />} />
              <Route path="chat" element={<ChatAI />} />
              <Route path="shopping" element={<Shopping />} />
              <Route path="colors" element={<ColorAnalysis />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;