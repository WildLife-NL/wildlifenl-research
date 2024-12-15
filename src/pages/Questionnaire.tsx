import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import DynamicView from '../components/DynamicView';
import QuestionView from '../components/QuestionView';
import '../styles/Questionnaire.css';
import { Questionnaire as QuestionnaireType } from '../types/questionnaire';
import { getQuestionnaireByID } from '../services/questionnaireService';

const Questionnaire: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireType | null>(
    location.state?.questionnaire || null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
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
      value: questionnaire.questions.length.toString()
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

    {/* QuestionView Component */}
    <div className="questionnaire-view-questions">
      <QuestionView fields={questionnaire.questions || []} experimentID={questionnaire.experiment.ID} />
    </div>
  </div>
  {/* Conditionally render Add or Edit Questions Button */}
          {questionnaire.questions && questionnaire.questions.length > 0 ? (
          <button
            className="edit-questions-button"
            onClick={navigateToEditQuestions}
            data-testid="edit-questions-button"
          >
            <img src="/assets/EditButtonSVG.svg" alt="Edit Questions" />
          </button>
        ) : (
          <button
            className="add-questions-button"
            onClick={navigateToCreateQuestions}
            data-testid="add-questions-button"
          >
            <img src="/assets/AddButtonSVG.svg" alt="Add Questions" />
          </button>
        )}
      </div>
    </>
  );
};

export default Questionnaire;