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
import MessageCreation from './pages/MessageCreation';
import MessageDashboard from './pages/MessageDashboard';
import Message from './pages/Message';
import ExperimentData from './pages/ExperimentData';
import Unauthorized from './pages/Unauthorized';
import { AnswerMessageRedirect, MessageListRedirect, QuestionEditorRedirect } from './pages/LegacyRedirects';
import AuthWrapper from './components/AuthWrapper';
import AppLayout from './components/AppLayout';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Unauthorized Route */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes share the top bar and footer of AppLayout */}
        <Route
          element={
            <AuthWrapper>
              <AppLayout />
            </AuthWrapper>
          }
        >
          {/* Default Route - Redirects to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Private Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/export" element={<Export />} />
          <Route path="/experimentcreation" element={<ExperimentCreation />} />
          <Route path="/experiment/:id" element={<Experiment />} />
          <Route path="/experimentdata/:id" element={<ExperimentData />} />
          <Route path="/questionnairedashboard/:id" element={<QuestionnaireDashboard />} />
          <Route path="/questionnairecreation/:id" element={<QuestionaireCreation />} />
          <Route path="/questionnaire/:id" element={<Questionnaire />} />
          <Route path="/questioncreation/" element={<QuestionEditorRedirect />} />
          <Route path="/questionedit/" element={<QuestionEditorRedirect />} />
          <Route path="/messagecreation/:id" element={<MessageCreation />} />
          <Route path="/messagecreationb/:id" element={<AnswerMessageRedirect />} />
          <Route path="/messagedashboard/:id" element={<MessageDashboard />} />
          <Route path="/message/:id/:messageId" element={<Message />} />
          <Route path="/message/:id" element={<MessageListRedirect />} />
          <Route path="/experiments" element={<Navigate to="/dashboard" replace />} />

          {/* Wildcard Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
