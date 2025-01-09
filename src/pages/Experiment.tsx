import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DynamicView from '../components/DynamicView';
import '../styles/Experiment.css';
import { Experiment as ExperimentType, UpdateExperiment } from '../types/experiment';
import { EndExperimentByID, DeleteExperimentByID, updateExperiment } from '../services/experimentService';
import { getAllLivingLabs } from '../services/livingLabService';
import ConfirmationPopup from '../components/ConfirmationPopup';
import { LivingLab } from '../types/livinglab';

const Experiment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const experiment = location.state?.experiment as ExperimentType | null;
  
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [isEditPopupVisible, setIsEditPopupVisible] = useState(false);

  // For editing
  const [editName, setEditName] = useState(experiment?.name ?? '');
  const [editDescription, setEditDescription] = useState(experiment?.description ?? '');
  const [editStart, setEditStart] = useState(experiment?.start ?? '');
  const [editEnd, setEditEnd] = useState(experiment?.end ?? '');
  const [editLivingLabID, setEditLivingLabID] = useState(experiment?.livingLab?.ID ?? '');
  const [editLivingLabName, setEditLivingLabName] = useState(experiment?.livingLab?.name ?? 'None');
  const [livingLabs, setLivingLabs] = useState<LivingLab[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const labs = await getAllLivingLabs();
        setLivingLabs(labs);
      } catch (error) {
        console.error('Failed to fetch living labs:', error);
      } finally {
        setLoadingLabs(false);
      }
    };
    fetchLabs();
  }, []);

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

  const handleEditExperimentButton = () => {
    setIsEditPopupVisible(true);
  };

  const handleSaveEdit = async () => {
    const payload: UpdateExperiment = {
      ID: experiment.ID, 
      name: editName,
      description: editDescription,
      start: editStart,
      ...(editEnd && { end: editEnd }),
      ...(editLivingLabID && { livingLabID: editLivingLabID })
    };
    try {
      await updateExperiment(experiment.ID, payload); 
      setIsEditPopupVisible(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating experiment:', error);
      alert('Failed to update experiment.');
    }
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

          {/* Edit Experiment Button */}
          <button
            className="delete-experiment-button" /* existing delete style */
            onClick={handleEditExperimentButton}
          >
            <img
              src="/assets/EditSVG.svg"
              alt="Edit Icon"
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

      {/* Edit Experiment Popup */}
      {isEditPopupVisible && (
        <div className="edit-experiment-popup">
          <div className="edit-popup-content">
            <h2>Edit Experiment</h2>
            <label>Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <label>Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              required
            />
            <label>Start Date</label>
            <input
              type="date"
              value={editStart.split('T')[0]}
              onChange={(e) => setEditStart(e.target.value)}
              required
            />
            <label>End Date</label>
            <input
              type="date"
              value={editEnd ? editEnd.split('T')[0] : ''}
              onChange={(e) => setEditEnd(e.target.value)}
            />
            <label>LivingLab</label>
            <div
              className={`experiment-creation-dropdown experiment-livinglab-dropdown ${isDropdownOpen ? 'experiment-creation-open' : ''}`}
            >
              <button
                type="button"
                className="experiment-creation-dropdown-button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {editLivingLabName}
                <img
                  src="/assets/vsvg.svg"
                  alt="Dropdown Icon"
                  className="experiment-creation-dropdown-icon"
                />
              </button>
              {isDropdownOpen && (
                <div className="experiment-creation-dropdown-content">
                  {loadingLabs ? (
                    <div>Loading...</div>
                  ) : (
                    <>
                      <div
                        className="experiment-creation-dropdown-item"
                        onClick={() => {
                          setEditLivingLabID('');
                          setEditLivingLabName('None');
                          setIsDropdownOpen(false);
                        }}
                      >
                        None
                      </div>
                      {livingLabs.map((lab) => (
                        <div
                          key={lab.ID}
                          className="experiment-creation-dropdown-item"
                          onClick={() => {
                            setEditLivingLabID(lab.ID);
                            setEditLivingLabName(lab.name);
                            setIsDropdownOpen(false);
                          }}
                        >
                          {lab.name}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="edit-popup-buttons">
              <button onClick={handleSaveEdit}>Save</button>
              <button onClick={() => setIsEditPopupVisible(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Experiment;
