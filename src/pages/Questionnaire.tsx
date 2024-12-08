import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DynamicView from '../components/DynamicView';
import QuestionView from '../components/QuestionView';
import '../styles/Questionnaire.css';
import { Questionnaire as QuestionnaireType } from '../types/questionnaire';


const Questionnaire: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  const navigateToCreateQuestions = () => {
    navigate('/questioncreation', { state: { questionnaire } });
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
      value: questionnaire.questions
        ? questionnaire.questions.length.toString()
        : 'N/A',
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
      <QuestionView fields={questionnaire.questions || []} />
    </div>
  </div>
  {/* Add Questions Button */}
  <button
            className="add-experiment-button"
            onClick={navigateToCreateQuestions}
            data-testid="add-experiment-button"
          >
            <img src="/assets/AddButtonSVG.svg" alt="Add Experiment" />
          </button>
  </div>
    </>
  );
};

export default Questionnaire;