import { API_BASE_URL } from '../apiBaseUrl';
import { getProblemMessage } from './problemDetails';

const API_URL = `${API_BASE_URL}/conveyances/experiment/`;
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getConveyancesByExperimentID = async (id: string): Promise<any[]> => {
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
      const errorMessage = await getProblemMessage(response, 'Failed to fetch delivered messages');
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return data as any[];

  } catch (error) {
    console.error('Error fetching responses:', error);
    throw error;
  }
};
