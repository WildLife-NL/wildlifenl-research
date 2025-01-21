import React, { useState, useEffect, useCallback } from 'react';
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
  const [originalQuestionIDs, setOriginalQuestionIDs] = useState<string[]>([]);
  const [originalAnswerIDs, setOriginalAnswerIDs] = useState<string[]>([]);

  useEffect(() => {
    if (questionnaire && Array.isArray(questionnaire.questions)) {
      const questionIDs: string[] = [];
      const answerIDs: string[] = [];

      const converted = questionnaire.questions.map((q: OriginalQuestion) => {
        const localId = q.ID || crypto.randomUUID(); 
        const hasAnswers = Array.isArray(q.answers) && q.answers.length > 0;
        const type: 'multiple' | 'single' = hasAnswers ? 'multiple' : 'single';

        const createdQ: CreatedQuestion = {
          localId,
          type,
          indexValue: q.index,
          questionText: q.text,
          isExisting: true,
        };

        questionIDs.push(q.ID);

        const answers = hasAnswers
          ? q.answers.map((a: OriginalAnswer) => {
              answerIDs.push(a.ID);
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
          allowMultipleResponse: q.allowMultipleResponse,
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
        isExisting: false,
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

  const handleQuestionTextChange = useCallback((questionLocalId: string, newText: string) => {
    setQuestions(prev => {
      let changed = false;
      const updated = prev.map(q => {
        if (q.localId === questionLocalId && q.questionText !== newText) {
          changed = true;
          return { ...q, questionText: newText };
        }
        return q;
      });
      return changed ? updated : prev;
    });
  }, []);

  const handleQuestionDataChange = useCallback((localId: string, data: FullQuestionData) => {
    setFullQuestions(prev => ({ ...prev, [localId]: data }));
  }, []);

  const questionData = questions.map(q => ({
    localId: q.localId,
    indexValue: q.indexValue,
    type: q.type,
    questionText: q.questionText
  }));

  // Validation function similar to what was done in QuestionCreation
  const validateData = (finalQuestions: FullQuestionData[]): boolean => {
    for (const fq of finalQuestions) {
      // Validate question-level fields
      if (!fq.text || fq.text.trim() === '') {
        alert(`Question at index ${fq.indexValue} has no title.`);
        return false;
      }
      if (!fq.description || fq.description.trim() === '') {
        alert(`Question "${fq.text}" (index ${fq.indexValue}) has no description.`);
        return false;
      }
      if (!fq.indexValue || fq.indexValue <= 0) {
        alert(`Question "${fq.text}" has an invalid index value (${fq.indexValue}).`);
        return false;
      }

      // If multiple choice or has answers, validate each answer
      if (fq.allowMultipleResponse || fq.answers.length > 0) {
        for (const ans of fq.answers) {
          if (!ans.text || ans.text.trim() === '') {
            alert(`Question "${fq.text}" has an answer with empty text.`);
            return false;
          }
          if (!ans.index || ans.index <= 0) {
            alert(`Question "${fq.text}" has an answer with an invalid index (${ans.index}).`);
            return false;
          }
        }
      }

      if (fq.allowOpenResponse && fq.openResponseFormat?.trim()) {
        try {
          new RegExp(fq.openResponseFormat);
        } catch {
          alert(`Question "${fq.indexValue}" has an invalid regex: ${fq.openResponseFormat}`);
          return false;
        }
      }
    }
    return true;
  };

  const saveQuestionsAndAnswers = async () => {
    try {
      const sortedQuestions = [...questions].sort((a, b) => a.indexValue - b.indexValue);
      const finalQuestions = sortedQuestions.map(q => fullQuestions[q.localId]).filter(Boolean);

      if (finalQuestions.length !== sortedQuestions.length) {
        alert('Not all questions have been fully defined. Please ensure all data is complete.');
        return;
      }

      // Validate before saving
      if (!validateData(finalQuestions)) {
        return; // Stop if validation fails
      }

      // Delete old answers
      for (const aID of originalAnswerIDs) {
        await deleteAnswer(aID);
      }

      // Delete old questions
      for (const qID of originalQuestionIDs) {
        await deleteQuestion(qID);
      }

      const localIdToRealId: Record<string, string> = {};
      // Add new questions
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

      // Add new answers
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
                  followUpOpen: ans.nextQuestionID ? true : false, // Set followUpOpen based on followUpQuestionId
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
