import {Questionnaire} from '../types/questionnaire'
const API_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl/questionnaires/';


const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};


export const getQuestionnaireByExperimentID = async (id: string): Promise<Questionnaire[]> => {
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
      throw new Error(`Failed to fetch messages: ${errorText}`);
    }

    const data = await response.json();
    return data as Questionnaire[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};