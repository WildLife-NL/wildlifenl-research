import {AddQuestionnaire, UpdatedQuestionnaire, Questionnaire} from '../types/questionnaire'
import { API_BASE_URL } from '../apiBaseUrl';
import { getProblemMessage } from './problemDetails';
import { deleteQuestion } from './questionService';
import { deleteAnswer } from './answerService';

const QUESTIONNAIRE_API_URL = `${API_BASE_URL}/questionnaire/`;
const QUESTIONNAIRES_API_URL = `${API_BASE_URL}/questionnaires/experiment/`;


const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const addQuestionnaire = async (questionnaireData: AddQuestionnaire): Promise<Questionnaire> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${QUESTIONNAIRE_API_URL}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json, application/problem+json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(questionnaireData),
    });

    console.log('Add Experiment response:', response);

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorMessage = await getProblemMessage(response, 'Failed to add questionnaire');
      console.error('Failed to add questionnaire:', errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Add Experiment error:', error);
    throw error;
  }
};

export const getQuestionnaireByExperimentID = async (id: string): Promise<Questionnaire[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${QUESTIONNAIRES_API_URL}${id}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch messages: ${errorText}`);
    }

    const data = await response.json();
    return data as Questionnaire[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const getQuestionnaireByID = async (id: string): Promise<Questionnaire> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${QUESTIONNAIRE_API_URL}${id}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch messages: ${errorText}`);
    }

    const questionnaire = await response.json();
    return questionnaire as Questionnaire;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

// Update Questionnaire
export const updateQuestionnaireByID = async (id: string, questionnaireData: UpdatedQuestionnaire): Promise<Questionnaire> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${QUESTIONNAIRE_API_URL}${id}`, { 
      method: 'PUT',
      headers: {
        Accept: 'application/json, application/problem+json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(questionnaireData),
    });

    console.log('Update Experiment response:', response);

    if (response.ok) {
      const data = await response.json();
      return data as Questionnaire;
    } else {
      const errorText = await response.text();
      console.error('Failed to update questionnaire:', errorText);
      throw new Error(errorText);
    }
  } catch (error) {
    console.error('Update questionnaire error:', error);
    throw error;
  }
};


// Delete Questionnaire
export const DeleteQuestionnaireByID = async (id: string): Promise<Questionnaire | void> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${QUESTIONNAIRE_API_URL}${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorMessage = await getProblemMessage(response, 'Failed to delete questionnaire');
      throw new Error(errorMessage);
    }

    // If the response is 204 No Content, there's no JSON to parse
    if (response.status === 204) {
      return;
    }

    // Otherwise, parse JSON
    const data = await response.json();
    return data as Questionnaire;

  } catch (error) {
    console.error('Error deleting questionnaire:', error);
    throw error;
  }
};

// Delete Questionnaire including its answers and questions
export const deleteQuestionnaireWithChildren = async (id: string): Promise<void> => {
  const questionnaire = await getQuestionnaireByID(id);

  for (const question of questionnaire.questions || []) {
    for (const answer of question.answers || []) {
      await deleteAnswer(answer.ID);
    }
  }

  for (const question of questionnaire.questions || []) {
    await deleteQuestion(question.ID);
  }

  await DeleteQuestionnaireByID(id);
};
