import { Answer } from "../types/answer";

const API_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl/answer/';
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Add Answer
export const addAnswer = async (answerData: any): Promise<Answer> => {
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
