import { InteractionType } from '../types/interactiontype';
import { API_BASE_URL } from '../apiBaseUrl';
import { getProblemMessage, NOT_ON_THIS_API } from './problemDetails';

const API_URL = `${API_BASE_URL}/interactions/`;

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getAllInteractions = async (): Promise<InteractionType[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json();
      console.error('Failed to fetch interaction types:', errorData);
      throw new Error('Failed to fetch interaction types');
    }
  } catch (error) {
    console.error('Error fetching interaction types:', error);
    throw error;
  }
};

// Get the interactions that happened inside the living lab of an experiment during its period, everywhere when it has no living lab
export const getInteractionsByExperimentID = async (id: string): Promise<any[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}experiment/${id}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorMessage = await getProblemMessage(response, 'Failed to fetch interactions');
      throw new Error(errorMessage);
    }

    // An API without this endpoint answers with its HTML documentation page
    if (!response.headers.get('Content-Type')?.includes('json')) {
      throw new Error(NOT_ON_THIS_API);
    }

    // Return raw JSON so every nested field reaches the CSV
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching interactions:', error);
    throw error;
  }
};
