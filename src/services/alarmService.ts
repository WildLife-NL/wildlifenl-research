import { Alarm } from '../types/alarm';
import { API_BASE_URL } from '../apiBaseUrl';
import { getProblemMessage } from './problemDetails';

const API_URL = `${API_BASE_URL}/alarms/`;

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Every alarm WildlifeNL raised, the API has no filters for them so the caller narrows them down
export const getAllAlarms = async (): Promise<Alarm[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorMessage = await getProblemMessage(response, 'Failed to fetch alarms');
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching alarms:', error);
    throw error;
  }
};
