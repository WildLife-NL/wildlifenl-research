import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DynamicView from '../components/DynamicView';
import '../styles/Questionnaire.css';
import { Questionnaire as QuestionnaireType } from '../types/questionnaire';

const Questionnaire: React.FC = () => {
  const location = useLocation();
  const questionnaire = location.state?.questionnaire as QuestionnaireType | null;

  if (!questionnaire) {
    return (
      <>
        <Navbar />
        <div className="questionnaire-view-not-found">
          <p>Questionnaire not found.</p>
        </div>
      </>
    );
  }

  // Prepare fields to display
  const fields = [
    { name: 'Name', value: questionnaire.name || 'N/A' },
    { name: 'Identifier', value: questionnaire.identifier || 'N/A' },
    {
      name: 'Interaction Type',
      value: questionnaire.interactionType?.name || 'N/A',
    },
    {
      name: 'Experiment',
      value: questionnaire.experiment?.name || 'N/A',
    },
    {
      name: 'Amount of Questions',
      value: questionnaire.questions
        ? questionnaire.questions.length.toString()
        : 'N/A',
    },
  ];

  return (
    <>
      <Navbar />
      <div className="questionnaire-view-container">
        {/* Title */}
        <h1 className="questionnaire-view-title">Questionnaire View</h1>

        {/* Questionnaire Details Component */}
        <div className="questionnaire-view-details">
          <DynamicView fields={fields} />
        </div>
      </div>
    </>
  );
};

export default Questionnaire;