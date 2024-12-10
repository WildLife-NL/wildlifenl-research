import {AddQuestionnaire, Questionnaire} from '../types/questionnaire'
const QUESTIONNAIRE_API_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl/questionnaire/';
const QUESTIONNAIRES_API_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl/questionnaires/';


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
      const errorData = await response.json();
      console.error('Failed to add experiment:', errorData);
      throw new Error('Failed to add experiment');
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

export const getQuestionnaireByID = async (id: string): Promise<Questionnaire[]> => {
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

    const data = await response.json();
    return data as Questionnaire[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};