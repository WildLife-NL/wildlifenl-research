import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react'; // Import useCallback
import Navbar from '../components/Navbar';
import DynamicView from '../components/DynamicView';
import QuestionView from '../components/QuestionView';
import ConfirmationPopup from '../components/ConfirmationPopup'; // Import ConfirmationPopup
import '../styles/Questionnaire.css';
import { Questionnaire as QuestionnaireType, UpdatedQuestionnaire } from '../types/questionnaire';
import { getQuestionnaireByID, DeleteQuestionnaireByID, updateQuestionnaireByID } from '../services/questionnaireService'; // Import update function
import { InteractionType } from '../types/interactiontype'; // Import InteractionType
import { getAllInteractions } from '../services/interactionTypeService'; // Import interaction types service
import { User } from '../types/user'; // Import User

const Questionnaire: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const loggedInUser: User | undefined = location.state?.user; // Add loggedInUser

  const [questionnaire, setQuestionnaire] = useState<QuestionnaireType | null>(
    location.state?.questionnaire || null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add state variables for confirmation popup
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  // Add state variables for edit popup
  const [isEditPopupVisible, setIsEditPopupVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIdentifier, setEditIdentifier] = useState('');
  const [editExperimentID, setEditExperimentID] = useState('');
  const [editInteractionTypeID, setEditInteractionTypeID] = useState<string | null>(null);
  const [interactionTypes, setInteractionTypes] = useState<InteractionType[]>([]); // Define interactionTypes state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Add state variables for error messages
  const [errorName, setErrorName] = useState('');

  // Memoize the confirmDeleteQuestionnaire function
  const confirmDeleteQuestionnaire = useCallback(async () => {
    if (!questionnaire) return;
    try {
      await DeleteQuestionnaireByID(questionnaire.ID.toString());
      navigate(-1);
    } catch (error) {
      console.error('Error deleting questionnaire:', error);
      alert('Failed to delete the questionnaire. Please try again.');
    }
  }, [questionnaire, navigate]);

  // Memoize the handleDeleteQuestionnaire function
  const handleDeleteQuestionnaire = useCallback(() => {
    setConfirmationMessage('Are you sure you want to delete this questionnaire?');
    setOnConfirmAction(() => confirmDeleteQuestionnaire);
    setIsConfirmationVisible(true);
  }, [confirmDeleteQuestionnaire]);

  // Memoize the cancelAction function
  const cancelAction = useCallback(() => {
    setIsConfirmationVisible(false);
    setConfirmationMessage('');
    setOnConfirmAction(null);
  }, []);

  // Handler to open the edit popup
  const handleEditQuestionnaire = useCallback(() => {
    if (questionnaire) {
      setEditName(questionnaire.name);
      setEditIdentifier(questionnaire.identifier || '');
      setEditExperimentID(questionnaire.experiment.ID.toString());
      setEditInteractionTypeID(questionnaire.interactionType?.ID || null);
      setIsEditPopupVisible(true);
    }
  }, [questionnaire]);

  // Handler to save the edited questionnaire
  const saveEditedQuestionnaire = async () => {
    let isValid = true;

    // Reset error messages
    setErrorName('');

    // Validate Name
    if (!editName) {
      setErrorName('Name is required.');
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    // Ensure questionnaire is not null
    if (!questionnaire) {
      alert('Questionnaire data is missing.');
      return;
    }

    const updatedData: UpdatedQuestionnaire = {
      name: editName,
      identifier: editIdentifier,
      experimentID: editExperimentID,
      interactionTypeID: editInteractionTypeID!, // Ensure this is a string
    };
    try {
      await updateQuestionnaireByID(questionnaire.ID.toString(), updatedData);
      setIsEditPopupVisible(false);
      // Refresh questionnaire data
      const refreshedQuestionnaire = await getQuestionnaireByID(questionnaire.ID.toString());
      setQuestionnaire(refreshedQuestionnaire);
    } catch (error) {
      console.error('Error updating questionnaire:', error);
      alert('Failed to update the questionnaire. Please try again.');
    }
  };

  // Handler to cancel editing
  const cancelEdit = useCallback(() => {
    setIsEditPopupVisible(false);
  }, []);

  // Fetch interaction types
  useEffect(() => {
    const fetchInteractionTypes = async () => {
      try {
        const types = await getAllInteractions();
        setInteractionTypes(types);
      } catch (error) {
        console.error('Failed to fetch interaction types:', error);
      }
    };
    fetchInteractionTypes();
  }, []);

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      if (questionnaire && questionnaire.ID) {
        try {
          const fetchedQuestionnaire = await getQuestionnaireByID(questionnaire.ID.toString());
          // Ensure questions is an array
          fetchedQuestionnaire.questions = fetchedQuestionnaire.questions || [];
          setQuestionnaire(fetchedQuestionnaire);
        } catch (err: any) {
          console.error('Error fetching questionnaire:', err);
          setError('Failed to fetch questionnaire.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
  
    fetchQuestionnaire();
  }, [questionnaire]);

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

  const status = questionnaire?.experiment.start ? getStatus(questionnaire.experiment.start, questionnaire.experiment.end) : 'Unknown';

  // Determine if the logged-in user is the creator of the experiment
  const isCreator = loggedInUser?.ID === questionnaire?.experiment.user.ID;

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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">
          <p>Loading questionnaire...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="error">
          <p>{error}</p>
        </div>
      </>
    );
  }

  const navigateToCreateQuestions = () => {
    navigate('/questioncreation', { state: { questionnaire } });
  };

  const navigateToEditQuestions = () => {
    navigate('/questionedit', { state: { questionnaire } });
  };

 

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
      name: 'Number of Questions',
      value: (questionnaire.questions || []).length.toString()
    },
  ];

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
    <div className="scrollable-body">
      <Navbar />
      <h1 className="questionnaire-view-title">
        View for Questionnaire: {truncateText(questionnaire?.name || `Questionnaire ${questionnaire.ID}`, 23)}
      </h1>
  <div className="questionnaire-view-container">
    {/* Questionnaire Details Component */}
    <div className="questionnaire-view-details">
      <DynamicView fields={fields} />
    </div>
    
    {/* Container for Delete and Edit Buttons */}
    <div className="questionnaire-buttons-container2">
      <button
        className={`questionnaire-button ${status === 'Upcoming' && isCreator ? 'red-button' : 'gray-button'}`} // Updated className
        onClick={status === 'Upcoming' && isCreator ? handleDeleteQuestionnaire : undefined}
        disabled={status !== 'Upcoming' || !isCreator}
        title={
          !isCreator
            ? 'A questionnaire can only be deleted by the owner.'
            : status !== 'Upcoming'
            ? 'Questionnaires can only be deleted before the experiment goes live.'
            : 'Delete this questionnaire and all included questions permanently'
        }
        data-testid="delete-questionnaire-button"
      >
        <span>Delete Questionnaire</span>
        <img src="/assets/TrashSVG.svg" alt="Delete Questionnaire" />
      </button>
      <button
        className={`questionnaire-button ${status === 'Upcoming' && isCreator ? 'blue-button' : 'gray-button'}`} // Updated className
        onClick={status === 'Upcoming' && isCreator ? handleEditQuestionnaire : undefined}
        disabled={status !== 'Upcoming' || !isCreator}
        title={
          !isCreator
            ? 'A questionnaire can only be edited by the owner.'
            : status !== 'Upcoming'
            ? 'Questionnaires can only be edited before the experiment goes live.'
            : 'Edit the details of this questionnaire'
        }
        data-testid="edit-questionnaire-button"
      >
        <span>Edit Questionnaire</span>
        <img src="/assets/EditSVG.svg" alt="Edit Questionnaire" />
      </button>
    </div>

    {/* QuestionView Component */}
    <div className="questionnaire-view-questions">
    <QuestionView fields={questionnaire.questions || []} experiment={questionnaire.experiment} loggedInUser={loggedInUser} />
    </div>
  </div>
  {/* Conditionally render Add or Edit Questions Button */}
          {questionnaire.questions && questionnaire.questions.length > 0 ? (
          <button
            className="edit-questions-button"
            onClick={status === 'Upcoming' ? navigateToEditQuestions : undefined}
            disabled={status !== 'Upcoming' || !isCreator}
            title={
              !isCreator
                ? 'Questions can only be edited by the owner of the experiment before it goes live'
                : status !== 'Upcoming'
                ? 'Questions can only be edited before the experiment goes live'
                : 'Edit the questions of this questionnaire'
            }
            data-testid="edit-questions-button"
          >
            <img
              src={status === 'Upcoming' && isCreator ? "/assets/EditButtonSVG.svg" : "/assets/GrayEditButtonSVG.svg"}
              alt="Edit Questions"
            />
          </button>
        ) : (
          <button
            className="add-questions-button"
            onClick={status === 'Upcoming' && isCreator ? navigateToCreateQuestions : undefined}
            disabled={status !== 'Upcoming' || !isCreator}
            title={
              !isCreator
                ? 'Questions can only be created by the owner of the experiment before it goes live'
                : status !== 'Upcoming'
                ? 'Questions can only be created before the experiment goes live'
                : 'Add new questions to this questionnaire'
            }
            data-testid="add-questions-button"
          >
            <img
              src={status === 'Upcoming' && isCreator ? "/assets/AddButtonSVG.svg" : "/assets/GrayAddButtonSVG.svg"}
              alt="Add Questions"
            />
          </button>
        )}

        {/* Confirmation Popup */}
        {isConfirmationVisible && (
          <ConfirmationPopup
            message={confirmationMessage}
            onConfirm={onConfirmAction!}
            onCancel={cancelAction}
          />
        )}

        {/* Edit Popup */}
        {isEditPopupVisible && (
          <div className="edit-questionnaire-popup"> {/* Updated class name */}
            <div className="edit-questionnaire-popup-content"> {/* Updated class name */}
              <h2>Edit Questionnaire</h2>
              {/* Name */}
              <label>Name*</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
              {errorName && <p className="error-message-update-questionnaire">{errorName}</p>}

              {/* Identifier */}
              <label>Identifier</label>
              <input
                type="text"
                value={editIdentifier}
                onChange={(e) => setEditIdentifier(e.target.value)}
              />

              {/* Interaction Type Dropdown */}
              <label>Interaction Type*</label>
              <div className={`questionnaireview-interactiontype-dropdown ${isDropdownOpen ? 'open' : ''}`}> {/* Updated class names */}
                <button
                  type="button"
                  className="questionnaireview-interactiontype-dropdown-button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {editInteractionTypeID
                    ? interactionTypes.find((type: InteractionType) => type.ID === editInteractionTypeID)?.name || 'Select Interaction Type'
                    : 'Select Interaction Type'}
                  <img
                    src="/assets/vsvg.svg"
                    alt="Dropdown Icon"
                    className="questionnaireview-interactiontype-dropdown-icon"
                  />
                </button>
                {isDropdownOpen && (
                  <div className="questionnaireview-interactiontype-dropdown-content"> 
                    {interactionTypes.map((type: InteractionType) => (
                      <div
                        key={type.ID}
                        className="questionnaireview-interactiontype-dropdown-item" 
                        onClick={() => {
                          setEditInteractionTypeID(type.ID);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {type.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="edit-questionnaire-popup-buttons"> {/* Updated class name */}
                <button onClick={saveEditedQuestionnaire}>Save</button>
                <button onClick={cancelEdit}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Questionnaire;