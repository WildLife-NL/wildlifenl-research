import { AddAnswer } from "../types/answer";

const TEST_BASE_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl';
const BASE_URL = process.env.NODE_ENV === 'test'
  ? TEST_BASE_URL
  : process.env.REACT_APP_BASE_URL;

const API_URL = `${BASE_URL}/answer/`;

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Add Answer
export const addAnswer = async (answerData: any): Promise<AddAnswer> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json, application/problem+json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(answerData),
    });

    console.log('Add Answer response:', response);

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json();
      console.error('Failed to add answer:', errorData);
      throw new Error('Failed to add answer');
    }
  } catch (error) {
    console.error('Add Answer error:', error);
    throw error;
  }
};


export const deleteAnswer = async (id: string): Promise<void> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete answer: ${errorText}`);
    }
  } catch (error) {
    console.error('Error deleting answer:', error);
    throw error;
  }
};