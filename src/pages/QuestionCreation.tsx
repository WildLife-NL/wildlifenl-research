import React, { useState } from 'react';
import Navbar from "../components/Navbar";
import AddQuestion from "../components/AddQuestion";
import { Questionnaire as QuestionnaireType } from '../types/questionnaire';
import '../styles/QuestionCreation.css';
import { useLocation } from 'react-router-dom';
import QuestionSelectionPopup from '../components/QuestionSelectionPopup';
import Question from '../components/Question';

interface CreatedQuestion {
  localId: string; // Unique local identifier for the question
  type: 'single' | 'multiple';
  indexValue: number; // User-adjustable index
  questionText: string; // Store the question text here
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
    const newId = crypto.randomUUID(); // Generate a UUID for this question

    // Determine the next index value by finding the max current index
    const maxIndexValue = questions.reduce((max, q) => Math.max(max, q.indexValue), 0);
    const nextIndexValue = maxIndexValue + 1;

    setQuestions((prev) => [
      ...prev,
      { localId: newId, type, indexValue: nextIndexValue, questionText: '' },
    ]);
    setShowPopup(false);
  };

  const handleQuestionIndexValueChange = (questionLocalId: string, newIndexValue: number) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = prevQuestions.map((q) =>
        q.localId === questionLocalId ? { ...q, indexValue: newIndexValue } : q
      );
      return updatedQuestions;
    });
  };

  const handleRemoveQuestion = (questionLocalId: string) => {
    setQuestions((prev) => prev.filter((q) => q.localId !== questionLocalId));
  };

  const handleQuestionTextChange = (questionLocalId: string, newText: string) => {
    setQuestions((prevQuestions) => {
      return prevQuestions.map((q) =>
        q.localId === questionLocalId ? { ...q, questionText: newText } : q
      );
    });
  };

  // We'll pass down the full question data to each Question so it can determine follow-ups and display names
  const questionData = questions.map(q => ({
    localId: q.localId,
    indexValue: q.indexValue,
    type: q.type,
    questionText: q.questionText
  }));

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
          .sort((a, b) => {
            // Sort primarily by indexValue ascending.
            if (a.indexValue !== b.indexValue) return a.indexValue - b.indexValue;
            return 0; 
          })
          .map((q) => (
            <Question
              key={q.localId}
              localId={q.localId}
              indexValue={q.indexValue}
              isMultipleChoice={q.type === 'multiple'}
              onRemoveQuestion={handleRemoveQuestion}
              onIndexValueChange={handleQuestionIndexValueChange}
              onQuestionTextChange={handleQuestionTextChange}
              allQuestions={questionData}
              currentQuestionText={q.questionText} // Pass the current question's text
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

      <button
        className="save-questions-button"
        onClick={() => {
          // On save, you'll now have stable localIds and references.
          // After the server assigns real IDs, map localIds to server IDs.
        }}
        data-testid="save-questions-button"
      >
        <img src="/assets/saveSVG.svg" alt="Save" />
      </button>
    </div>
  );
};

export default QuestionCreation;
