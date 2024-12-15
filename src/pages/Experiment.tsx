import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import DynamicView from '../components/DynamicView';
import '../styles/Experiment.css';
import { Experiment as ExperimentType } from '../types/experiment';
import { EndExperimentByID, DeleteExperimentByID } from '../services/experimentService';
import ConfirmationPopup from '../components/ConfirmationPopup';

const Experiment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const experiment = location.state?.experiment as ExperimentType | null;
  
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);
  const [isStopping, setIsStopping] = useState(false);

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
    navigate(`/questionnairedashboard/${experiment.ID}`, { state: { experiment } });
  };

  const handleMessageOverviewClick = async () => {
    if (!experiment) return;
    try {
      navigate(`/messagedashboard/${experiment.ID}`, { state: { experiment } });
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const confirmStopExperiment = async () => {
    setIsConfirmationVisible(false);
    setIsStopping(true);

    if (!experiment) return;

    try {
      const result = await EndExperimentByID(experiment.ID);
      console.log('Experiment stopped:', result);
      alert('Experiment has been successfully stopped.');
      navigate('/experiments');
    } catch (error) {
      console.error('Error stopping experiment:', error);
      alert('Failed to stop the experiment. Please try again.');
    } finally {
      setIsStopping(false);
    }
  };

  const confirmDeleteExperiment = async () => {
    setIsConfirmationVisible(false);

    if (!experiment) return;

    try {
      
      DeleteExperimentByID(experiment.ID);
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting experiment:', error);
      alert('Failed to delete the experiment. Please try again.');
    } finally {
      setIsStopping(false);
    }
  };

  const cancelAction = () => {
    setIsConfirmationVisible(false);
    setConfirmationMessage('');
    setOnConfirmAction(null);
  };

  // Handlers for showing confirmation popup
  const handleStopExperiment = () => {
    setConfirmationMessage('Are you sure you want to permanently stop the experiment?');
    setOnConfirmAction(() => confirmStopExperiment);
    setIsConfirmationVisible(true);
  };

  const handleDeleteExperiment = () => {
    setConfirmationMessage('Are you sure you want to permanently delete the experiment?');
    setOnConfirmAction(() => confirmDeleteExperiment);
    setIsConfirmationVisible(true);
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Navbar />
      <div className="experiment-container">
        {/* Title */}
        <h1 className="experiment-view-title">
          View for Experiment: {truncateText(experiment?.name || `Experiment ${experiment.ID}`, 23)}
        </h1>

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
            disabled={isStopping}
          >
            <span className="stop-button-text">
              {isStopping ? 'Stopping...' : 'Stop Experiment'}
            </span>
          </button>
          
          {/* Delete Experiment Button */}
          <button
            className="delete-experiment-button"
            onClick={handleDeleteExperiment}
          >
            <img
              src="/assets/TrashSVG.svg"
              alt="Delete Icon"
              className="delete-experiment-button-icon"
            />
          </button>
        </div>
      </div>

      {/* Confirmation Popup */}
      {isConfirmationVisible && (
        <ConfirmationPopup
          message={confirmationMessage}
          onConfirm={onConfirmAction!}
          onCancel={cancelAction}
        />
      )}
    </>
  );
};

export default Experiment;
