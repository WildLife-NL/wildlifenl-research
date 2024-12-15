import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/QuestionnaireCreation.css';
import { AddQuestionnaire } from '../types/questionnaire';
import { addQuestionnaire } from '../services/questionnaireService';
import { getAllInteractions } from '../services/interactionTypeService';
import { InteractionType } from '../types/interactiontype';

const QuestionnaireCreation: React.FC = () => {
  const { id: experimentID } = useParams<{ id: string }>(); // Get experimentID from URL
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [interactionTypes, setInteractionTypes] = useState<InteractionType[]>([]);
  const [interactionTypeID, setInteractionTypeID] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [interactionTypeError, setInteractionTypeError] = useState('');
  
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchInteractionTypes = async () => {
      try {
        const interactionTypes: InteractionType[] = await getAllInteractions();
        setInteractionTypes(interactionTypes);
      } catch (error) {
        console.error('Failed to fetch interaction types:', error);
      }
    };
    fetchInteractionTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let isValid = true;

    // Reset custom error messages
    setInteractionTypeError('');

    // Validate Interaction Type
    if (!interactionTypeID) {
      setInteractionTypeError('Please select an interaction type.');
      isValid = false;
    }

    // Trigger native validation messages
    const form = formRef.current;
    if (form && !form.checkValidity()) {
      form.reportValidity();
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    const questionnaireData: AddQuestionnaire = {
      experimentID: experimentID!,
      name: name,
      identifier: identifier,
      interactionTypeID: interactionTypeID!,
    };

    try {
      const response = await addQuestionnaire(questionnaireData);
      console.log('Questionnaire added successfully:', response);
      navigate(`/QuestionnaireDashboard/${experimentID}`);
    } catch (error) {
      console.error('Error adding questionnaire:', error);
    }
  };

  return (
    <div className="questionnaire-creation-container">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <div className="questionnaire-creation-main-container">
        {/* Title */}
        <h1 className="questionnaire-creation-page-title">New Questionnaire</h1>

        {/* Content Box */}
        <form
          className="questionnaire-creation-content-box"
          onSubmit={handleSubmit}
          noValidate
          ref={formRef}
        >
          {/* Name */}
          <label className="questionnaire-creation-section-label">
            Name*
          </label>
          <input
            type="text"
            className="questionnaire-creation-text-input"
            placeholder="Enter questionnaire name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Identifier */}
          <label className="questionnaire-creation-section-label">
            Internal Name
          </label>
          <input
            type="text"
            className="questionnaire-creation-text-input"
            placeholder="Enter internal questionnaire name..."
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          {/* Interaction Type */}
          <label className="questionnaire-creation-section-label">
            Interaction Type*
          </label>
          <div
            className={`questionnaire-creation-dropdown ${
              isDropdownOpen ? 'open' : ''
            } ${interactionTypeError ? 'error' : ''}`}
          >
            <button
              type="button"
              className="questionnaire-creation-dropdown-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {interactionTypeID
                ? interactionTypes.find((type) => type.ID === interactionTypeID)?.name
                : 'Select Interaction Type'}
              <img
                src="/assets/vsvg.svg"
                alt="Dropdown Icon"
                className="questionnaire-creation-dropdown-icon"
              />
            </button>
            {isDropdownOpen && (
              <div className="questionnaire-creation-dropdown-content">
                {interactionTypes.map((type) => (
                  <div
                    key={type.ID}
                    className="questionnaire-creation-dropdown-item"
                    onClick={() => {
                      setInteractionTypeID(type.ID);
                      setIsDropdownOpen(false);
                      setInteractionTypeError('');
                    }}
                  >
                    {type.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Interaction Type Error Message */}
          {interactionTypeError && (
            <div className="error-message">{interactionTypeError}</div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="questionnaire-creation-submit-button"
          >
            <img src="/assets/saveSVG.svg" alt="Submit Questionnaire" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuestionnaireCreation;
