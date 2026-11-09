import { TrackingReading } from '../types/trackingreading';
import { API_BASE_URL } from '../apiBaseUrl';
import { getProblemMessage, NOT_ON_THIS_API } from './problemDetails';

const API_URL = `${API_BASE_URL}/tracking-readings/experiment/`;

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Get the location readings of app users inside the living lab of an experiment during its period, everywhere when it has no living lab
export const getTrackingReadingsByExperimentID = async (id: string): Promise<TrackingReading[]> => {
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
      const errorMessage = await getProblemMessage(response, 'Failed to fetch tracking readings');
      throw new Error(errorMessage);
    }

    // An API without this endpoint answers with its HTML documentation page
    if (!response.headers.get('Content-Type')?.includes('json')) {
      throw new Error(NOT_ON_THIS_API);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching tracking readings:', error);
    throw error;
  }
};
