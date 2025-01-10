import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Export from './pages/Export';
import ExperimentCreation from './pages/ExperimentCreation';
import Experiment from './pages/Experiment';
import QuestionnaireDashboard from './pages/QuestionnaireDashboard';
import QuestionaireCreation from './pages/QuestionnaireCreation';
import Questionnaire from './pages/Questionnaire';
import QuestionCreation from './pages/QuestionCreation';
import QuestionEdit from './pages/QuestionEdit';
import MessageCreation from './pages/MessageCreation';
import MessageCreationB from './pages/MessageCreationB';
import MessageDashboard from './pages/MessageDashboard';
import Message from './pages/Message';
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
                <Route path="/profile" element={<Profile />} />
                <Route path="/export" element={<Export />} />
                <Route path="/experimentcreation" element={<ExperimentCreation />} />
                <Route path="/experiment/:id" element={<Experiment />} />
                <Route path="/questionnairedashboard/:id" element={<QuestionnaireDashboard />} />
                <Route path="/questionnairecreation/:id" element={<QuestionaireCreation />} />
                <Route path="/questionnaire/:id" element={<Questionnaire />} />
                <Route path="/questioncreation/" element={<QuestionCreation />} />
                <Route path="/questionedit/" element={<QuestionEdit />} />
                <Route path="/messagecreation/:id" element={<MessageCreation />} />
                <Route path="/messagecreationb/:id" element={<MessageCreationB />} />
                <Route path="/messagedashboard/:id" element={<MessageDashboard />} />
                <Route path="/message/:id" element={<Message />} />

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