import { AddQuestionWithAnswers, Question } from "../types/question";
import { API_BASE_URL } from '../apiBaseUrl';
import { getProblemMessage } from './problemDetails';
import { addAnswer, deleteAnswer } from './answerService';

const API_URL = `${API_BASE_URL}/question/`;
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Add Question
export const addQuestion = async (questionData: any): Promise<Question> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json, application/problem+json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(questionData),
    });

    console.log('Add Question response:', response);

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorMessage = await getProblemMessage(response, 'Failed to add question');
      console.error('Failed to add question:', errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Add Question error:', error);
    throw error;
  }
};

//Get Question by ID
export const getQuestionByID = async (id: string): Promise<Question[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}${id}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch questions: ${errorText}`);
    }

    const data = await response.json();
    return data as Question[];
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

// Delete Question
export const deleteQuestion = async (id: string): Promise<void> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorMessage = await getProblemMessage(response, 'Failed to delete question');
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

// Add Questions with their Answers.
// If anything fails, everything added so far is deleted again so no question is left without its answers.
export const addQuestionsWithAnswers = async (questionnaireID: string, questions: AddQuestionWithAnswers[]): Promise<void> => {
  const localIdToRealId: Record<string, string> = {};
  const addedAnswerIDs: string[] = [];

  try {
    for (const question of questions) {
      const addedQuestion = await addQuestion({
        allowMultipleResponse: question.allowMultipleResponse,
        allowOpenResponse: question.allowOpenResponse,
        description: question.description,
        index: question.index,
        openResponseFormat: question.openResponseFormat,
        text: question.text,
        questionnaireID,
      });
      localIdToRealId[question.localId] = addedQuestion.ID;
    }

    for (const question of questions) {
      for (const answer of question.answers) {
        const addedAnswer = await addAnswer({
          index: answer.index,
          questionID: localIdToRealId[question.localId],
          nextQuestionID: answer.nextQuestionID ? localIdToRealId[answer.nextQuestionID] : null,
          text: answer.text,
        });
        addedAnswerIDs.push(addedAnswer.ID);
      }
    }
  } catch (error) {
    for (const answerID of addedAnswerIDs) {
      await deleteAnswer(answerID).catch(() => undefined);
    }
    for (const questionID of Object.values(localIdToRealId)) {
      await deleteQuestion(questionID).catch(() => undefined);
    }
    throw error;
  }
};
