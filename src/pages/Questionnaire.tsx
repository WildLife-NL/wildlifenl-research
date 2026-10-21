import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react'; // Import useCallback
import Navbar from '../components/Navbar';
import DynamicView from '../components/DynamicView';
import QuestionView from '../components/QuestionView';
import ConfirmationPopup from '../components/ConfirmationPopup'; // Import ConfirmationPopup
import '../styles/Questionnaire.css';
import { Questionnaire as QuestionnaireType, UpdatedQuestionnaire } from '../types/questionnaire';
import { getQuestionnaireByID, deleteQuestionnaireWithChildren, updateQuestionnaireByID, cloneQuestionnaire } from '../services/questionnaireService'; // Import update function
import { getMyExperiments } from '../services/experimentService';
import { getMinLength } from '../services/schemaService';
import { InteractionType } from '../types/interactiontype'; // Import InteractionType
import { getAllInteractions } from '../services/interactionTypeService'; // Import interaction types service
import { User } from '../types/user'; // Import User
import { Experiment } from '../types/experiment';

const Questionnaire: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const loggedInUser: User | undefined = location.state?.user; // Add loggedInUser
  const stateExperiment: Experiment | undefined = location.state?.experiment;
  const stateQuestionnaire: QuestionnaireType | undefined = location.state?.questionnaire;
  const questionnaireID = stateQuestionnaire?.ID ?? id;
  const hasStateQuestionnaire = !!stateQuestionnaire;

  const [questionnaire, setQuestionnaire] = useState<QuestionnaireType | null>(
    stateQuestionnaire || null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const experiment: Experiment | undefined = questionnaire?.experiment ?? stateExperiment;
  const ownerID = experiment?.user?.ID ?? stateExperiment?.user?.ID;

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

  // Add state variables for clone popup
  const [isClonePopupVisible, setIsClonePopupVisible] = useState(false);
  const [cloneTargets, setCloneTargets] = useState<Experiment[] | null>(null);
  const [cloneExperimentID, setCloneExperimentID] = useState<string | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [cloneIdentifier, setCloneIdentifier] = useState('');
  const [cloneInteractionTypeID, setCloneInteractionTypeID] = useState<string | null>(null);
  const [isCloneExperimentDropdownOpen, setIsCloneExperimentDropdownOpen] = useState(false);
  const [isCloneInteractionDropdownOpen, setIsCloneInteractionDropdownOpen] = useState(false);
  const [cloneError, setCloneError] = useState('');
  const [isCloning, setIsCloning] = useState(false);

  // Memoize the confirmDeleteQuestionnaire function
  const confirmDeleteQuestionnaire = useCallback(async () => {
    setIsConfirmationVisible(false);
    if (!questionnaire) return;
    try {
      await deleteQuestionnaireWithChildren(questionnaire.ID.toString());
      navigate(-1);
    } catch (error) {
      console.error('Error deleting questionnaire:', error);
      const message = error instanceof Error ? error.message : 'Please try again.';
      alert(`Failed to delete the questionnaire.\n${message}`);
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
      setEditExperimentID(experiment?.ID.toString() ?? '');
      setEditInteractionTypeID(questionnaire.interactionType?.ID || null);
      setIsEditPopupVisible(true);
    }
  }, [questionnaire, experiment]);

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
      refreshedQuestionnaire.questions = refreshedQuestionnaire.questions || [];
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

  // Handler to open the clone popup, only upcoming experiments of the user can receive the clone
  const handleCloneQuestionnaire = async () => {
    if (!questionnaire) return;
    setCloneName(`Copy of ${questionnaire.name}`);
    setCloneIdentifier(questionnaire.identifier || '');
    setCloneInteractionTypeID(questionnaire.interactionType?.ID || null);
    setCloneExperimentID(null);
    setCloneError('');
    setCloneTargets(null);
    setIsClonePopupVisible(true);
    try {
      const myExperiments = await getMyExperiments();
      setCloneTargets((myExperiments || []).filter((exp) => getStatus(exp.start, exp.end) === 'Upcoming'));
    } catch (error) {
      console.error('Error fetching experiments:', error);
      setCloneTargets([]);
      setCloneError('Failed to fetch your experiments. Please try again.');
    }
  };

  // Handler to clone the questionnaire into the selected experiment
  const saveClonedQuestionnaire = async () => {
    if (!questionnaire) return;

    let nameMinLength: number | undefined;
    try {
      nameMinLength = await getMinLength('Questionnaire', 'name');
    } catch (error) {
      setCloneError(error instanceof Error ? error.message : 'Could not load the validation rules. Please try again.');
      return;
    }
    if (!cloneExperimentID) {
      setCloneError('Please select an experiment.');
      return;
    }
    if (!cloneName) {
      setCloneError('Name is required.');
      return;
    }
    if (nameMinLength && cloneName.length < nameMinLength) {
      setCloneError(`Name must be at least ${nameMinLength} characters long.`);
      return;
    }
    if (!cloneInteractionTypeID) {
      setCloneError('Please select an interaction type.');
      return;
    }

    setCloneError('');
    setIsCloning(true);
    try {
      const clone = await cloneQuestionnaire(questionnaire.ID.toString(), {
        experimentID: cloneExperimentID,
        name: cloneName,
        identifier: cloneIdentifier,
        interactionTypeID: cloneInteractionTypeID,
      });
      setIsClonePopupVisible(false);
      navigate(`/questionnaire/${clone.ID}`, {
        state: {
          questionnaire: clone,
          experiment: cloneTargets?.find((exp) => exp.ID === cloneExperimentID),
          user: loggedInUser,
        },
      });
    } catch (error) {
      console.error('Error cloning questionnaire:', error);
      const message = error instanceof Error ? error.message : 'Please try again.';
      alert(`Failed to clone the questionnaire.\n${message}`);
    } finally {
      setIsCloning(false);
    }
  };

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

  // Depending on the questionnaire state itself would refetch forever, since every fetch replaces that state.
  useEffect(() => {
    let cancelled = false;
    const fetchQuestionnaire = async () => {
      if (!questionnaireID) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const fetchedQuestionnaire = await getQuestionnaireByID(questionnaireID.toString());
        if (cancelled) return;
        // Ensure questions is an array
        fetchedQuestionnaire.questions = fetchedQuestionnaire.questions || [];
        setQuestionnaire(fetchedQuestionnaire);
      } catch (err: any) {
        console.error('Error fetching questionnaire:', err);
        if (!cancelled && !hasStateQuestionnaire) {
          setError('Failed to fetch questionnaire.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchQuestionnaire();
    return () => {
      cancelled = true;
    };
  }, [questionnaireID, hasStateQuestionnaire]);

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

  const status = experiment?.start ? getStatus(experiment.start, experiment.end) : 'Unknown';

  // Determine if the logged-in user is the creator of the experiment
  const isCreator = !!loggedInUser && !!ownerID && loggedInUser.ID === ownerID;

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
      value: experiment?.name || 'N/A',
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
      <button
        className="questionnaire-button green-button"
        onClick={handleCloneQuestionnaire}
        title="Copy this questionnaire with all its questions and answers into one of your upcoming experiments"
        data-testid="clone-questionnaire-button"
      >
        <span>Clone Questionnaire</span>
        <img src="/assets/questionnaireSVG.svg" alt="Clone Questionnaire" className="questionnaire-clone-icon" />
      </button>
    </div>

    {/* QuestionView Component */}
    <div className="questionnaire-view-questions">
    <QuestionView fields={questionnaire.questions || []} experiment={experiment} isCreator={isCreator} />
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

        {/* Clone Popup */}
        {isClonePopupVisible && (
          <div className="edit-questionnaire-popup" data-testid="clone-questionnaire-popup">
            <div className="edit-questionnaire-popup-content">
              <h2>Clone Questionnaire</h2>

              {/* Target Experiment Dropdown */}
              <label>Experiment*</label>
              {cloneTargets === null ? (
                <p>Loading your experiments...</p>
              ) : cloneTargets.length === 0 ? (
                <p>You have no upcoming experiments. Create an experiment first to clone this questionnaire into.</p>
              ) : (
                <div className={`questionnaireview-interactiontype-dropdown questionnaire-clone-dropdown ${isCloneExperimentDropdownOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="questionnaireview-interactiontype-dropdown-button"
                    onClick={() => setIsCloneExperimentDropdownOpen(!isCloneExperimentDropdownOpen)}
                    data-testid="clone-experiment-dropdown-button"
                  >
                    {truncateText(cloneTargets.find((exp) => exp.ID === cloneExperimentID)?.name || 'Select Experiment', 25)}
                    <img
                      src="/assets/vsvg.svg"
                      alt="Dropdown Icon"
                      className="questionnaireview-interactiontype-dropdown-icon"
                    />
                  </button>
                  {isCloneExperimentDropdownOpen && (
                    <div className="questionnaireview-interactiontype-dropdown-content">
                      {cloneTargets.map((exp) => (
                        <div
                          key={exp.ID}
                          className="questionnaireview-interactiontype-dropdown-item"
                          onClick={() => {
                            setCloneExperimentID(exp.ID);
                            setIsCloneExperimentDropdownOpen(false);
                          }}
                        >
                          {exp.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Name */}
              <label>Name*</label>
              <input
                type="text"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                required
                data-testid="clone-name-input"
              />

              {/* Identifier */}
              <label>Identifier</label>
              <input
                type="text"
                value={cloneIdentifier}
                onChange={(e) => setCloneIdentifier(e.target.value)}
              />

              {/* Interaction Type Dropdown */}
              <label>Interaction Type*</label>
              <div className={`questionnaireview-interactiontype-dropdown ${isCloneInteractionDropdownOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="questionnaireview-interactiontype-dropdown-button"
                  onClick={() => setIsCloneInteractionDropdownOpen(!isCloneInteractionDropdownOpen)}
                >
                  {cloneInteractionTypeID
                    ? interactionTypes.find((type: InteractionType) => type.ID === cloneInteractionTypeID)?.name || 'Select Interaction Type'
                    : 'Select Interaction Type'}
                  <img
                    src="/assets/vsvg.svg"
                    alt="Dropdown Icon"
                    className="questionnaireview-interactiontype-dropdown-icon"
                  />
                </button>
                {isCloneInteractionDropdownOpen && (
                  <div className="questionnaireview-interactiontype-dropdown-content">
                    {interactionTypes.map((type: InteractionType) => (
                      <div
                        key={type.ID}
                        className="questionnaireview-interactiontype-dropdown-item"
                        onClick={() => {
                          setCloneInteractionTypeID(type.ID);
                          setIsCloneInteractionDropdownOpen(false);
                        }}
                      >
                        {type.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cloneError && <p className="questionnaire-clone-error">{cloneError}</p>}

              {/* Buttons */}
              <div className="edit-questionnaire-popup-buttons">
                <button
                  onClick={saveClonedQuestionnaire}
                  disabled={isCloning || !cloneTargets || cloneTargets.length === 0}
                  data-testid="clone-save-button"
                >
                  {isCloning ? 'Cloning...' : 'Clone'}
                </button>
                <button onClick={() => setIsClonePopupVisible(false)} disabled={isCloning}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Questionnaire;