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
import { isAuthenticated } from './services/authService';
import AuthWrapper from './components/AuthWrapper';

const App: React.FC = () => {
  return (
    <Router>
      <AuthWrapper>
        <Routes>
          {/* Default Route - Redirects to dashboard or login */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />}
          />

          {/* Public Route - Login */}
          <Route path="/login" element={<Login />} />

          {/* Private Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/export" element={<Export />} />
          <Route path="/experimentcreation" element={<ExperimentCreation />} />
          <Route path="/experiment/:id" element={<Experiment />} />
          <Route path="/messagecreation/:id" element={<MessageCreation />} />
          <Route path="/messagedashboard/:id" element={<MessageDashboard />} />
          {/* Unauthorized Route */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Wildcard Route */}
          <Route path="*" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </AuthWrapper>
    </Router>
  );
};

export default App;
