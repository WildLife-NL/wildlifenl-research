import {AddQuestionnaire, UpdatedQuestionnaire, Questionnaire} from '../types/questionnaire'
const QUESTIONNAIRE_API_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl/questionnaire/';
const QUESTIONNAIRES_API_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl/questionnaires/experiment/';


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
      const errorText = await response.text();
      throw new Error(`Failed to delete questionnaire: ${errorText}`);
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