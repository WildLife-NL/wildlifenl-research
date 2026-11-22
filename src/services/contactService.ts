import { Contact } from '../types/contact';
import { API_BASE_URL } from '../apiBaseUrl';
import { getProblemMessage, NOT_ON_THIS_API } from './problemDetails';

const API_URL = `${API_BASE_URL}/contacts/`;

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Contacts that started or ended during the experiment with the app user inside its living lab, everywhere when it has no living lab
export const getContactsByExperimentID = async (id: string): Promise<Contact[]> => {
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
      const errorMessage = await getProblemMessage(response, 'Failed to fetch contacts');
      throw new Error(errorMessage);
    }

    // An API without this endpoint answers with its HTML documentation page
    if (!response.headers.get('Content-Type')?.includes('json')) {
      throw new Error(NOT_ON_THIS_API);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};
