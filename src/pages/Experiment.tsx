import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import DynamicView from '../components/DynamicView';
import '../styles/Experiment.css';
import { Experiment as ExperimentType, UpdateExperiment } from '../types/experiment';
import { EndExperimentByID, DeleteExperimentByID, updateExperiment, getExperiments } from '../services/experimentService';
import { getAllLivingLabs } from '../services/livingLabService';
import ConfirmationPopup from '../components/ConfirmationPopup';
import { LivingLab } from '../types/livinglab';
import { User } from '../types/user'; // Added import

const Experiment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract loggedInUser from navigation state
  const loggedInUser: User | undefined = location.state?.user;

  const [currentExperiment, setCurrentExperiment] = useState<ExperimentType | null>(null);
  
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [isEditPopupVisible, setIsEditPopupVisible] = useState(false);

  // For editing
  const [editName, setEditName] = useState(currentExperiment?.name ?? '');
  const [editDescription, setEditDescription] = useState(currentExperiment?.description ?? '');
  const [editStart, setEditStart] = useState(currentExperiment?.start ?? '');
  const [editEnd, setEditEnd] = useState(currentExperiment?.end ?? '');
  const [editLivingLabID, setEditLivingLabID] = useState(currentExperiment?.livingLab?.ID ?? '');
  const [editLivingLabName, setEditLivingLabName] = useState(currentExperiment?.livingLab?.name ?? 'None');
  const [livingLabs, setLivingLabs] = useState<LivingLab[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // New state variables for error messages
  const [errorName, setErrorName] = useState('');
  const [errorDescription, setErrorDescription] = useState('');
  const [errorStart, setErrorStart] = useState('');

  // Add refs for start and end date inputs
  const editStartDateRef = useRef<HTMLInputElement>(null);
  const editEndDateRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (location.state?.experiment?.ID) {
      (async () => {
        const allExperiments = await getExperiments();
        const fresh = allExperiments.find(exp => exp.ID === location.state.experiment.ID);
        setCurrentExperiment(fresh || null);
      })();
    }
  }, [location.state]);

  useEffect(() => {
    if (currentExperiment) {
      setEditName(currentExperiment.name);
      setEditDescription(currentExperiment.description);
      setEditStart(currentExperiment.start);
      setEditEnd(currentExperiment.end);
      setEditLivingLabID(currentExperiment.livingLab?.ID ?? '');
      setEditLivingLabName(currentExperiment.livingLab?.name ?? 'None');
    }
  }, [currentExperiment]);

  if (!currentExperiment) {
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
    { name: 'Experiment Title', value: currentExperiment.name },
    { name: 'Description', value: currentExperiment.description },
    {
      name: 'Duration',
      value: currentExperiment.end
        ? `${new Date(currentExperiment.start).toLocaleDateString()} - ${new Date(currentExperiment.end).toLocaleDateString()}`
        : `${new Date(currentExperiment.start).toLocaleDateString()} - No End-date`,
    },
    { name: 'Specified LivingLab', value: currentExperiment.livingLab?.name || 'N/A' },
    { name: 'Number of Questionnaires', value: currentExperiment.numberOfQuestionnaires?.toString() || '0' },
    { name: 'Responses on Questionnaires', value: currentExperiment.questionnaireActivity?.toString() || '0' },
    { name: 'Number of Messages', value: currentExperiment.numberOfMessages?.toString() || '0' },
    { name: 'Messages Sent', value: currentExperiment.messageActivity?.toString() || '0' },
    { name: 'Owner of the experiment', value: currentExperiment.user?.name || 'N/A' },
  ];
  
  // Navigation handlers
  const handleQuestionnaireOverviewClick = () => {
    navigate(`/questionnairedashboard/${currentExperiment.ID}`, { state: { experiment: currentExperiment, user: loggedInUser} });
  };

  const handleMessageOverviewClick = async () => {
    if (!currentExperiment) return;
    try {
      navigate(`/messagedashboard/${currentExperiment.ID}`, { state: { experiment: currentExperiment, user: loggedInUser } });
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const confirmStopExperiment = async () => {
    setIsConfirmationVisible(false);
    setIsStopping(true);

    if (!currentExperiment) return;

    try {
      const result = await EndExperimentByID(currentExperiment.ID);
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

    if (!currentExperiment) return;

    try {
      
      DeleteExperimentByID(currentExperiment.ID);
      
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

  // Add validateDates function
  const validateDates = (): boolean => {
    const now = new Date();
    const start = new Date(editStart);
    const end = editEnd ? new Date(editEnd) : null;

    let isValid = true;

    // Reset custom validity
    if (editStartDateRef.current) {
      editStartDateRef.current.setCustomValidity('');
    }
    if (editEndDateRef.current) {
      editEndDateRef.current.setCustomValidity('');
    }

    // Validate Start Date
    if (start < now) {
      if (editStartDateRef.current) {
        editStartDateRef.current.setCustomValidity('Start date cannot be in the past.');
      }
      isValid = false;
    }

    // Validate End Date
    if (end) {
      if (end <= start) {
        if (editEndDateRef.current) {
          editEndDateRef.current.setCustomValidity('End date must be later than start date.');
        }
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSaveEdit = async () => {
    let isValid = true;

    // Reset error messages
    setErrorName('');
    setErrorDescription('');
    setErrorStart('');

    // Perform date validation
    isValid = validateDates() && isValid;

    if (!isValid) {
      if (editStartDateRef.current) {
        editStartDateRef.current.reportValidity();
      }
      if (editEndDateRef.current) {
        editEndDateRef.current.reportValidity();
      }
      return;
    }

    // Validate Name
    if (!editName.trim()) {
      setErrorName('Name is required.');
      isValid = false;
    }

    // Validate Description
    if (!editDescription.trim()) {
      setErrorDescription('Description is required.');
      isValid = false;
    }

    // Validate Start Date
    if (!editStart) {
      setErrorStart('Start date is required.');
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    const payload: UpdateExperiment = {
      ID: currentExperiment.ID, 
      name: editName,
      description: editDescription,
      start: new Date(editStart).toISOString(),
      ...(editEnd && { end: new Date(editEnd).toISOString() }),
      ...(editLivingLabID && { livingLabID: editLivingLabID })
    };
    try {
      await updateExperiment(currentExperiment.ID, payload); 
      const allExperiments = await getExperiments();
      const updatedExperiment = allExperiments.find(exp => exp.ID === currentExperiment.ID);
      if (updatedExperiment) {
        // Replace the experiment in state
        setCurrentExperiment(updatedExperiment);
      }
      setIsEditPopupVisible(false);
    } catch (error) {
      console.error('Error updating experiment:', error);
      alert('Failed to update experiment.');
    }
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getStatus = (startDate: string, endDate?: string | null): string => {
    const today = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    if (start > today) {
      return 'Upcoming';
    } else if (end && end < today) {
      return 'Completed';
    } else {
      return 'Live';
    }
  };

  const status = getStatus(currentExperiment.start, currentExperiment.end);

  // Determine if the logged-in user is the creator of the experiment
  const isCreator = loggedInUser?.ID === currentExperiment.user?.ID;

  return (
    <>
      <Navbar />
      <div className="experiment-container">
        {/* Title */}
        <h1 className="experiment-view-title">
          View for Experiment: {truncateText(currentExperiment?.name || `Experiment ${currentExperiment.ID}`, 23)}
        </h1>

        {/* Experiment Details Component */}
        <div className="experiment-details-component">
          <DynamicView fields={fields} />
        </div>

        {/* Buttons Container */}
        <div className="buttons-container">
          {/* View Questionnaires (always green, never disabled) */}
          <button
            className={`experiment-button green-button`}
            onClick={handleQuestionnaireOverviewClick}
            title="View all questionnaires for this experiment"
          >
            <span>View Questionnaires</span>
            <img
              src="/assets/questionnaireSVG.svg"
              alt="Questionnaire Icon"
              className="experiment-button-icon"
            />
          </button>

          {/* View Messages (always green, never disabled) */}
          <button
            className="experiment-button green-button"
            onClick={handleMessageOverviewClick}
            title="View all messages for this experiment"
          >
            <span>View Messages</span>
            <img
              src="/assets/messageSVG.svg"
              alt="Message Icon"
              className="experiment-button-icon"
            />
          </button>

          {/* Stop Experiment (red if Live and creator, else gray) */}
          <button
            className={`experiment-button ${
              status === 'Live' && isCreator && !isStopping ? 'red-button' : 'gray-button'
            }`}
            title={
              !isCreator
                ? 'An experiment can only be stopped by the owner when it is live'
                : status !== 'Live'
                ? 'An experiment can only be stopped when it is live'
                : 'Stop this experiment permanently'
            }
            onClick={
              status === 'Live' && isCreator && !isStopping ? handleStopExperiment : undefined
            }
            disabled={status !== 'Live' || !isCreator || isStopping}
          >
            <span>{isStopping ? 'Stopping...' : 'Stop Experiment'}</span>
            <img
              src="/assets/StopSVG.svg"
              alt="Stop Icon"
              className="experiment-button-icon stop-button-icon"
            />
          </button>

          {/* Delete Experiment (red if deletable and owner, else gray) */}
          <button
            className={`experiment-button ${
              isCreator && status !== 'Live' && status !== 'Completed' ? 'red-button' : 'gray-button'
            }`}
            title={
              !isCreator
                ? 'An experiment can only be deleted by the owner before being live'
                : status === 'Live' || status === 'Completed'
                ? 'An experiment can only be deleted while it is not live or completed'
                : 'Delete this experiment permanently'
            }
            onClick={
              isCreator && status !== 'Live' && status !== 'Completed' ? handleDeleteExperiment : undefined
            }
            disabled={!isCreator || status === 'Live' || status === 'Completed'}
          >
            <span>Delete Experiment</span>
            <img
              src="/assets/TrashSVG.svg"
              alt="Delete Icon"
              className="experiment-button-icon"
            />
          </button>

          {/* Edit Experiment (blue if Upcoming and owner, else gray) */}
          <button
            className={`experiment-button ${
              status === 'Upcoming' && isCreator ? 'blue-button' : 'gray-button'
            }`}
            title={
              !isCreator
                ? 'An experiment can only be edited by the owner before being live'
                : status !== 'Upcoming'
                ? 'An experiment can only be edited before being live'
                : 'Edit the experiment details'
            }
            onClick={
              status === 'Upcoming' && isCreator ? handleEditExperimentButton : undefined
            }
            disabled={status !== 'Upcoming' || !isCreator}
          >
            <span>Edit Experiment</span>
            <img
              src="/assets/EditSVG.svg"
              alt="Edit Icon"
              className="experiment-button-icon"
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
            {errorName && <p className="error-message-update-experiment">{errorName}</p>}
            
            <label>Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              required
            />
            {errorDescription && <p className="error-message-update-experiment">{errorDescription}</p>}
            
            <label>Start Date</label>
            <input
              type="date"
              value={editStart.split('T')[0]}
              onChange={(e) => {
                setEditStart(e.target.value);
                validateDates();
              }}
              ref={editStartDateRef}
              required
            />
            {errorStart && <p className="error-message-update-experiment">{errorStart}</p>}
            
            <label>End Date</label>
            <input
              type="date"
              value={editEnd ? editEnd.split('T')[0] : ''}
              onChange={(e) => {
                setEditEnd(e.target.value);
                validateDates();
              }}
              ref={editEndDateRef}
            />
            
            <label>LivingLab</label>
            <div
              className={`experimentview-dropdown ${isDropdownOpen ? 'experimentview-open' : ''}`}
            >
              <button
                type="button"
                className="experimentview-dropdown-button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {editLivingLabName}
                <img
                  src="/assets/vsvg.svg"
                  alt="Dropdown Icon"
                  className="experimentview-dropdown-icon"
                />
              </button>
              {isDropdownOpen && (
                <div className="experimentview-dropdown-content">
                  {loadingLabs ? (
                    <div>Loading...</div>
                  ) : (
                    <>
                      <div
                        className="experimentview-dropdown-item"
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
                          className="experimentview-dropdown-item"
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
