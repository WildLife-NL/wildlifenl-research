import React, { useState } from 'react';
import Navbar from "../components/Navbar";
import AddQuestion from "../components/AddQuestion";
import { Questionnaire as QuestionnaireType } from '../types/questionnaire';
import '../styles/QuestionCreation.css';
import { useLocation } from 'react-router-dom';
import QuestionSelectionPopup from '../components/QuestionSelectionPopup';
import Question from '../components/Question';

interface CreatedQuestion {
  id: number; // Unique identifier
  type: 'single' | 'multiple';
}

const QuestionCreation: React.FC = () => {
  const location = useLocation();
  const questionnaire = location.state?.questionnaire as QuestionnaireType | null;

  const [showPopup, setShowPopup] = useState(false);
  const [questions, setQuestions] = useState<CreatedQuestion[]>([]);

  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleOpenPopup = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleSelectType = (type: 'single' | 'multiple') => {
    const newId = Date.now(); // Generate a unique ID
    setQuestions((prev) => [
      ...prev,
      { id: newId, type },
    ]);
    setShowPopup(false);
  };

  const handleRemoveQuestion = (questionId: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  return (
    <div className="scrollable-body">
      <Navbar />
      <h1 className="question-view-title">
        Create Questions for:{' '}
        {truncateText(
          questionnaire?.name || `Questionnaire ${questionnaire?.ID}`,
          23
        )}
      </h1>
        <div>
          {questions.map((q, index) => (
            <Question
              key={q.id}
              id={q.id} // Pass the unique ID
              questionIndex={index + 1} // Display index
              isMultipleChoice={q.type === 'multiple'}
              onRemoveQuestion={handleRemoveQuestion}
            />
          ))}
        </div>
      <div className="AddQuestion-Button">
        <AddQuestion onClick={handleOpenPopup} />
      </div>

      {showPopup && (
        <QuestionSelectionPopup
          onClose={handleClosePopup}
          onSelectType={handleSelectType}
        />
      )}

    </div>
  );
};

export default QuestionCreation;