import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DynamicView from '../components/DynamicView';
import '../styles/Experiment.css';
import { Experiment as ExperimentType } from '../types/experiment';
import { updateExperiment } from '../services/experimentService';

const Experiment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const experiment = location.state?.experiment as ExperimentType | null;

  if (!experiment) {
    return (
      <>
        <Navbar />
        <div className="experiment-not-found">
          <p>Experiment not found.</p>
        </div>
      </>
    );
  }
  const fields = [
    { name: 'Experiment Title', value: experiment.name },
    { name: 'Description', value: experiment.description },
    {
      name: 'Duration',
      value: `${new Date(experiment.start).toLocaleDateString()} - ${new Date(experiment.end).toLocaleDateString()}`,
    },
    { name: 'Specified LivingLab', value: experiment.livingLab?.name || 'N/A' },
    { name: 'Number of Questionnaires', value: experiment.numberOfQuestionnaires?.toString() || '0' },
    { name: 'Responses on Questionnaires', value: experiment.questionnaireActivity?.toString() || '0' },
    { name: 'Number of Messages', value: experiment.numberOfMessages?.toString() || '0' },
    { name: 'Messages Sent', value: experiment.messageActivity?.toString() || '0' },
  ];
  
  // Navigation handlers
  const handleQuestionnaireOverviewClick = () => {
    navigate(`/questionnairedashboard/${experiment.ID}`);
  };

  const handleMessageOverviewClick = async () => {
    if (!experiment) return;
    try {
      navigate(`/messagedashboard/${experiment.ID}`);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Handler for stopping the experiment
  const handleStopExperiment = async () => {
    if (!experiment) return;
    try {
      // Update the end time to the current time
      const updatedExperiment = {
        ...experiment,
        end: new Date().toISOString(),
      };

      // Call the updateExperiment function
      const result = await updateExperiment(updatedExperiment);

      // Optionally navigate or update the UI
      console.log('Experiment stopped:', result);
      alert('Experiment has been successfully stopped.');
      // Navigate back to the experiments list or another appropriate page
      navigate('/experiments');
    } catch (error) {
      console.error('Error stopping experiment:', error);
      alert('Failed to stop the experiment. Please try again.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="experiment-container">
        {/* Title */}
        <h1 className="experiment-view-title">Experiment View</h1>

        {/* Experiment Details Component */}
        <div className="experiment-details-component">
          <DynamicView fields={fields} />
        </div>

        {/* Buttons Container */}
        <div className="buttons-container">
          {/* Questionnaire Overview Button */}
          <button
            className="view-questionnaires-button"
            onClick={handleQuestionnaireOverviewClick}
          >
            <span className="view-questionnaires-button-text">View Questionnaires</span>
            <img
              src="/assets/questionnaireSVG.svg"
              alt="Questionnaire Icon"
              className="view-questionnaires-button-icon"
            />
          </button>

          {/* View Messages Button */}
          <button
            className="view-messages-button"
            onClick={handleMessageOverviewClick}
          >
            <span className="view-messages-button-text">View Messages</span>
            <img
              src="/assets/messageSVG.svg"
              alt="Message Icon"
              className="view-messages-button-icon"
            />
          </button>

          {/* Stop Experiment Button */}
          <button
            className="stop-experiment-button"
            onClick={handleStopExperiment}
          >
            <span className="stop-button-text">Stop Experiment</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default Experiment;
