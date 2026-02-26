import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';
import './App.css';

import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import CreateJob from './pages/CreateJob';
import EditJob from './pages/EditJob';
import ApplyJob from './pages/ApplyJob';
import MyApplications from './pages/MyApplications';
import Applicants from './pages/Applicants';
import Analytics from './pages/Analytics';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/dashboard" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/create-job" element={<ProtectedRoute role="employer"><CreateJob /></ProtectedRoute>} />
        <Route path="/edit-job/:id" element={<ProtectedRoute role="employer"><EditJob /></ProtectedRoute>} />
        <Route path="/apply/:id" element={<ProtectedRoute role="applicant"><ApplyJob /></ProtectedRoute>} />
        <Route path="/my-applications" element={<ProtectedRoute role="applicant"><MyApplications /></ProtectedRoute>} />
        <Route path="/jobs/:id/applicants" element={<ProtectedRoute role="employer"><Applicants /></ProtectedRoute>} />
      </Routes>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#ffffff', color: '#111111', border: '1px solid #e6e6e8' }
      }} />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
