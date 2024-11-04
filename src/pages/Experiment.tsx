import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/Experiment.css';
import { getMessagesByExperimentID } from '../services/messageService';
import { Experiment as ExperimentType } from '../types/experiment';
import { updateExperiment } from '../services/experimentService'; // Import the update function

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

  // Navigation handlers
  const handleQuestionnaireOverviewClick = () => {
    navigate(`/questionnairedashboard/${experiment.ID}`);
  };

  const handleMessageOverviewClick = async () => {
    if (!experiment) return;
    try {
      const messages = await getMessagesByExperimentID(experiment.ID);
      navigate(`/messagedashboard/${experiment.ID}`, { state: { messages, experiment } });
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Optionally display an error message to the user
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
          {/* Experiment Title Component */}
          <div className="experiment-title-comp">
            <span className="experiment-title-text">Experiment title</span>
            <div className="experiment-textbar">
              <p className="experiment-textbar-content">{experiment.name}</p>
            </div>
          </div>

          {/* Description Component */}
          <div className="description-comp">
            <span className="description-text">Description</span>
            <div className="description-textbar">
              <p className="description-textbar-content">{experiment.description}</p>
            </div>
          </div>

          {/* Duration Set Component */}
          <div className="duration-set-comp">
            <span className="duration-text">Duration of experiment</span>
            <div className="time-set">
              <div className="time-set-box">
                {new Date(experiment.start).toLocaleDateString()}
              </div>
              <span className="date-separator">-</span>
              <div className="time-set-box">
                {new Date(experiment.end).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Location Set Component */}
          <div className="location-set-comp">
            <span className="location-text">Specified LivingLab</span>
            <div className="location-box">
              <p className="location-box-text">
                {experiment.livingLab?.name || 'N/A'}
              </p>
            </div>
          </div>

          {/* Stop Experiment Button */}
          <button className="stop-experiment-button" onClick={handleStopExperiment}>
            Stop Experiment
          </button>
        </div>

        {/* Buttons */}
        <div className="buttons-container">
          {/* Questionnaire Overview Button */}
          <button
            className="overview-button questionnaire-overview-button"
            onClick={handleQuestionnaireOverviewClick}
          >
            <div className="button-top">
              <span className="button-text">Questionnaires</span>
              <img
                src="/assets/questionnaireSVG.svg"
                alt="Questionnaire Icon"
                className="button-icon"
              />
            </div>
            <div className="button-content">
              <p>Amount: {experiment.numberOfQuestionnaires || 0}</p>
              <p>Responses: {experiment.questionnaireActivity || 0}</p>
            </div>
          </button>

          {/* Message Overview Button */}
          <button
            className="overview-button message-overview-button"
            onClick={handleMessageOverviewClick}
          >
            <div className="button-top">
              <span className="button-text">Messages</span>
              <img
                src="/assets/messageSVG.svg"
                alt="Message Icon"
                className="button-icon"
              />
            </div>
            <div className="button-content">
              <p>Amount: {experiment.numberOfMessages || 0}</p>
              <p>Sent: {experiment.messageActivity || 0}</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default Experiment;
