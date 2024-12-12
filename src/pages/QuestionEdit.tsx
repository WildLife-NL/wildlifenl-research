import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import AddQuestion from "../components/AddQuestion";
import { Questionnaire as QuestionnaireType } from '../types/questionnaire';
import { Question as OriginalQuestion } from '../types/question';
import { Answer as OriginalAnswer } from '../types/answer';
import '../styles/QuestionCreation.css';
import { useLocation } from 'react-router-dom';
import QuestionSelectionPopup from '../components/QuestionSelectionPopup';
import Question from '../components/Question';
import { addQuestion, deleteQuestion } from '../services/questionService';
import { addAnswer, deleteAnswer } from '../services/answerService';

interface CreatedQuestion {
  localId: string;
  type: 'single' | 'multiple';
  indexValue: number;
  questionText: string;
  isExisting: boolean;
}

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
    text: string;
    nextQuestionID: string | null; 
  }[];
}

const QuestionEdit: React.FC = () => {
  const location = useLocation();
  const questionnaire = location.state?.questionnaire as QuestionnaireType | null;

  const [showPopup, setShowPopup] = useState(false);
  const [questions, setQuestions] = useState<CreatedQuestion[]>([]);
  const [fullQuestions, setFullQuestions] = useState<Record<string, FullQuestionData>>({});
  const existingQuestions = questions.filter(q => q.isExisting);
  const newQuestions = questions.filter(q => !q.isExisting);
  // Store original question IDs and answer IDs for deletion
  const [originalQuestionIDs, setOriginalQuestionIDs] = useState<string[]>([]);
  const [originalAnswerIDs, setOriginalAnswerIDs] = useState<string[]>([]);

  // QuestionEdit.tsx

useEffect(() => {
  if (questionnaire && Array.isArray(questionnaire.questions)) {
    const questionIDs: string[] = [];
    const answerIDs: string[] = [];

    // Convert existing saved questions to local editor format
    const converted = questionnaire.questions.map((q: OriginalQuestion) => {
      console.log('Processing Question:', q); // Debugging line

      const localId = crypto.randomUUID();
      // Determine type based on the presence of answers
      const hasAnswers = Array.isArray(q.answers) && q.answers.length > 0;
      const type: 'multiple' | 'single' = hasAnswers ? 'multiple' : 'single';
      console.log(`Mapped Question ID: ${q.ID}, Type: ${type}`); // Debugging line

      const createdQ: CreatedQuestion = {
        localId,
        type,
        indexValue: q.index,
        questionText: q.text,
        isExisting: true, // Mark as existing
      };

      // Extract original IDs
      questionIDs.push(q.ID);

      // Convert existing answers
      const answers = hasAnswers
        ? q.answers.map((a: OriginalAnswer) => {
            answerIDs.push(a.ID); // Store original answer ID
            return {
              index: a.index,
              text: a.text,
              nextQuestionID: a.nextQuestionID || null
            };
          })
        : [];

      const fullData: FullQuestionData = {
        localId,
        indexValue: q.index,
        text: q.text,
        description: q.description,
        allowMultipleResponse: hasAnswers, // Reflecting multiple-choice based on answers
        allowOpenResponse: q.allowOpenResponse,
        openResponseFormat: q.openResponseFormat,
        answers: answers
      };

      setFullQuestions(prev => ({ ...prev, [localId]: fullData }));
      return createdQ;
    });

    setOriginalQuestionIDs(questionIDs);
    setOriginalAnswerIDs(answerIDs);
    setQuestions(converted);

    console.log('Original Question IDs:', questionIDs);
    console.log('Original Answer IDs:', answerIDs);
    console.log('Converted Questions:', converted);
    console.log('Full Questions:', fullQuestions);
  }
}, [questionnaire]);

  

  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleOpenPopup = () => setShowPopup(true);
  const handleClosePopup = () => setShowPopup(false);

  const handleSelectType = (type: 'single' | 'multiple') => {
    const newId = crypto.randomUUID(); 
    const maxIndexValue = questions.reduce((max, q) => Math.max(max, q.indexValue), 0);
    const nextIndexValue = maxIndexValue + 1;
  
    setQuestions(prev => [
      ...prev,
      {
        localId: newId,
        type,
        indexValue: nextIndexValue,
        questionText: '',
        isExisting: false, // Mark as new
      },
    ]);
    setShowPopup(false);
  };
  const handleQuestionIndexValueChange = (questionLocalId: string, newIndexValue: number) => {
    setQuestions(prev => prev.map(q =>
      q.localId === questionLocalId ? { ...q, indexValue: newIndexValue } : q
    ));
  };

  const handleRemoveQuestion = (questionLocalId: string) => {
    setQuestions(prev => prev.filter(q => q.localId !== questionLocalId));
    setFullQuestions(prev => {
      const { [questionLocalId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleQuestionTextChange = (questionLocalId: string, newText: string) => {
    setQuestions(prev => prev.map(q =>
      q.localId === questionLocalId ? { ...q, questionText: newText } : q
    ));
  };

  const handleQuestionDataChange = (localId: string, data: FullQuestionData) => {
    setFullQuestions(prev => ({ ...prev, [localId]: data }));
  };

  const questionData = questions.map(q => ({
    localId: q.localId,
    indexValue: q.indexValue,
    type: q.type,
    questionText: q.questionText
  }));

  const saveQuestionsAndAnswers = async () => {
    try {
      const sortedQuestions = [...questions].sort((a, b) => a.indexValue - b.indexValue);
      const finalQuestions = sortedQuestions.map(q => fullQuestions[q.localId]).filter(Boolean);

      if (finalQuestions.length !== sortedQuestions.length) {
        alert('Not all questions have been fully defined. Please ensure all data is complete.');
        return;
      }

      // Step 1: Delete all original answers first
      // We assume originalAnswerIDs is an array of all old answer IDs
      for (const aID of originalAnswerIDs) {
        await deleteAnswer(aID);
      }

      // Step 2: Delete all original questions
      for (const qID of originalQuestionIDs) {
        await deleteQuestion(qID);
      }

      // Step 3: Add the new questions
      const localIdToRealId: Record<string, string> = {};
      for (const fq of finalQuestions) {
        const questionPayload = {
          allowMultipleResponse: fq.allowMultipleResponse,
          allowOpenResponse: fq.allowOpenResponse,
          description: fq.description,
          index: fq.indexValue,
          openResponseFormat: fq.openResponseFormat,
          text: fq.text,
          questionnaireID: questionnaire?.ID
        };

        const createdQuestion = await addQuestion(questionPayload);
        localIdToRealId[fq.localId] = createdQuestion.ID;
      }

      // Step 4: Add the new answers
      for (const fq of finalQuestions) {
        for (const ans of fq.answers) {
          const answerPayload = {
            index: ans.index,
            questionID: localIdToRealId[fq.localId],
            text: ans.text,
            nextQuestionID: ans.nextQuestionID ? localIdToRealId[ans.nextQuestionID] : null
          };
          await addAnswer(answerPayload);
        }
      }
      alert('Questions and answers updated successfully!');
      window.history.back();
    } catch (error) {
      console.error('Error updating questions and answers:', error);
      alert('Failed to update. Please try again.');
    }
  };

  return (
    <div className="scrollable-body">
      <Navbar />
      <h1 className="question-view-title">
        Edit Questions for:{' '}
        {truncateText(
          questionnaire?.name || `Questionnaire ${questionnaire?.ID}`,
          23
        )}
      </h1>
      <div>
      {existingQuestions
  .sort((a, b) => a.indexValue - b.indexValue)
  .map((q) => {
    const fq = fullQuestions[q.localId];
    const initialAnswers = fq
      ? fq.answers.map((ans, i) => ({
          id: String.fromCharCode(65 + i),
          answerIndexValue: ans.index,
          text: ans.text,
          followUpQuestionId: ans.nextQuestionID,
          followUpOpen: false,
        }))
      : [];

    return (
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
        onQuestionDataChange={handleQuestionDataChange}
        initialDescription={fq?.description}
        initialAllowMultiple={fq?.allowMultipleResponse}
        initialAllowOpen={fq?.allowOpenResponse}
        initialOpenResponseFormat={fq?.openResponseFormat}
        initialAnswers={initialAnswers}
      />
    );
  })}
  {newQuestions
  .sort((a, b) => a.indexValue - b.indexValue)
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
      onQuestionDataChange={handleQuestionDataChange}
      // No initial* props needed for new questions
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
        onClick={saveQuestionsAndAnswers}
        data-testid="save-questions-button"
      >
        <img src="/assets/saveSVG.svg" alt="Save" />
      </button>
    </div>
  );
};

export default QuestionEdit;
