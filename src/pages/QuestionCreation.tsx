import React, { useState } from 'react';
import Navbar from "../components/Navbar";
import AddQuestion from "../components/AddQuestion";
import { Questionnaire as QuestionnaireType } from '../types/questionnaire';
import '../styles/QuestionCreation.css';
import { useLocation } from 'react-router-dom';
import QuestionSelectionPopup from '../components/QuestionSelectionPopup';
import Question from '../components/Question';

import { addQuestion } from '../services/questionService';
import { addAnswer } from '../services/answerService';

interface CreatedQuestion {
  localId: string; // Unique local identifier for the question
  type: 'single' | 'multiple';
  indexValue: number; // User-adjustable index
  questionText: string; // Store the question text here
}

// This should match what we send from Question.tsx
interface FullQuestionData {
  localId: string;
  indexValue: number;
  text: string;
  description: string;
  allowMultipleResponse: boolean;
  allowOpenResponse: boolean;
  openResponseFormat: string;
  answers: {
    index: number;
    nextQuestionID: string | null; // localId here
    text: string;
  }[];
}

const QuestionCreation: React.FC = () => {
  const location = useLocation();
  const questionnaire = location.state?.questionnaire as QuestionnaireType | null;

  const [showPopup, setShowPopup] = useState(false);
  const [questions, setQuestions] = useState<CreatedQuestion[]>([]);

  // NEW: A state to store full question details from Question components
  const [fullQuestions, setFullQuestions] = useState<Record<string, FullQuestionData>>({}); // ADDED

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
    const newId = crypto.randomUUID(); 
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
    // Also remove from fullQuestions map if present
    setFullQuestions(prev => {
      const { [questionLocalId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleQuestionTextChange = (questionLocalId: string, newText: string) => {
    setQuestions((prevQuestions) => {
      return prevQuestions.map((q) =>
        q.localId === questionLocalId ? { ...q, questionText: newText } : q
      );
    });
  };

  // NEW: Handle full question data from the Question component
  const handleQuestionDataChange = (localId: string, data: FullQuestionData) => {
    setFullQuestions(prev => ({ ...prev, [localId]: data }));
  }; // ADDED

  const questionData = questions.map(q => ({
    localId: q.localId,
    indexValue: q.indexValue,
    type: q.type,
    questionText: q.questionText
  }));

  // NEW: Implementing saveQuestionsAndAnswers
  const saveQuestionsAndAnswers = async () => {
    try {
      const sortedQuestions = [...questions].sort((a, b) => a.indexValue - b.indexValue);

      // Gather full details for each question
      const finalQuestions = sortedQuestions.map(q => fullQuestions[q.localId]).filter(Boolean);

      if (finalQuestions.length !== sortedQuestions.length) {
        alert('Not all questions have been fully defined. Please ensure all data is complete.');
        return;
      }

      const localIdToRealId: Record<string, string> = {};

      // First add all questions
      for (const fq of finalQuestions) {
        const questionPayload = {
          allowMultipleResponse: fq.allowMultipleResponse,
          allowOpenResponse: fq.allowOpenResponse,
          description: fq.description,
          index: fq.indexValue,
          openResponseFormat: fq.openResponseFormat,
          text: fq.text,
          questionnaireID: questionnaire?.ID // Make sure to use questionnaireID exactly as API specifies
        };
        

        const createdQuestion = await addQuestion(questionPayload);
        localIdToRealId[fq.localId] = createdQuestion.ID;
      }

      // Then add answers
      for (const fq of finalQuestions) {
        for (const ans of fq.answers) {
          const answerPayload = {
            index: ans.index,
            questionID: localIdToRealId[fq.localId], // Use questionID instead of questionId
            nextQuestionID: ans.nextQuestionID ? localIdToRealId[ans.nextQuestionID] : null,
            text: ans.text
          };
          await addAnswer(answerPayload);
        }
      }

      alert('Questions and answers saved successfully!');
      window.history.back();
    } catch (error) {
      console.error('Error saving questions and answers:', error);
      alert('Failed to save. Please try again.');
    }
  }; // ADDED

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
              currentQuestionText={q.questionText}

              // Pass the new callback for full data
              onQuestionDataChange={handleQuestionDataChange} // ADDED
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
        onClick={saveQuestionsAndAnswers} // call the new save function
        data-testid="save-questions-button"
      >
        <img src="/assets/saveSVG.svg" alt="Save" />
      </button>
    </div>
  );
};

export default QuestionCreation;
