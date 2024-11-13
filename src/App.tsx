import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Activity from './pages/Activity';
import Profile from './pages/Profile';
import Export from './pages/Export';
import ExperimentCreation from './pages/ExperimentCreation';
import Experiment from './pages/Experiment';
import MessageCreation from './pages/MessageCreation';
import MessageDashboard from './pages/MessageDashboard';
import Unauthorized from './pages/Unauthorized';
import AuthWrapper from './components/AuthWrapper';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Unauthorized Route */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <AuthWrapper>
              <Routes>
                {/* Default Route - Redirects to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Private Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/export" element={<Export />} />
                <Route path="/experimentcreation" element={<ExperimentCreation />} />
                <Route path="/experiment/:id" element={<Experiment />} />
                <Route path="/messagecreation/:id" element={<MessageCreation />} />
                <Route path="/messagedashboard/:id" element={<MessageDashboard />} />

                {/* Wildcard Route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AuthWrapper>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;