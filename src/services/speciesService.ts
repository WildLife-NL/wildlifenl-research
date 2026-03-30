import { Species } from "../types/species";
import { API_BASE_URL } from '../apiBaseUrl';

const API_URL = `${API_BASE_URL}/species/`;

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getAllSpecies = async (): Promise<Species[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Get All Species response:', response);

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json();
      console.error('Failed to fetch all species:', errorData);
      throw new Error('Failed to fetch all species');
    }
  } catch (error) {
    console.error('Get All Species error:', error);
    throw error;
  }
};
