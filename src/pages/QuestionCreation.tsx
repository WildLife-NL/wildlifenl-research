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
  indexValue: number; // User-adjustable index
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
    const newId = Date.now();
    const nextIndexValue = questions.length + 1;
    setQuestions((prev) => [
      ...prev,
      { id: newId, type, indexValue: nextIndexValue },
    ]);
    setShowPopup(false);
  };
  const handleQuestionIndexValueChange = (questionId: number, newIndexValue: number) => {
    setQuestions((prevQuestions) => {
      const questionToMove = prevQuestions.find((q) => q.id === questionId);
      if (!questionToMove) return prevQuestions;
  
      // Update the indexValue of the specified question
      const updatedQuestion = { ...questionToMove, indexValue: newIndexValue };
  
      // Replace the question in the array with the updated one
      const updatedQuestions = prevQuestions.map((q) =>
        q.id === questionId ? updatedQuestion : q
      );
  
      return updatedQuestions;
    });
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
        {questions
          .sort((a, b) => a.indexValue - b.indexValue)
          .map((q) => (
            <Question
              key={q.id}
              id={q.id}
              indexValue={q.indexValue}
              isMultipleChoice={q.type === 'multiple'}
              onRemoveQuestion={handleRemoveQuestion}
              onIndexValueChange={handleQuestionIndexValueChange}
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