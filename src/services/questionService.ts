import { Question } from "../types/question";

const API_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl/question/';
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Add Question
export const addQuestion = async (questionData: any): Promise<Question> => {
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
      body: JSON.stringify(questionData),
    });

    console.log('Add Question response:', response);

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json();
      console.error('Failed to add question:', errorData);
      throw new Error('Failed to add question');
    }
  } catch (error) {
    console.error('Add Question error:', error);
    throw error;
  }
};

//Get Question by ID
export const getQuestionByID = async (id: string): Promise<Question[]> => {
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
      throw new Error(`Failed to fetch questions: ${errorText}`);
    }

    const data = await response.json();
    return data as Question[];
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

// Delete Question
export const deleteQuestion = async (id: string): Promise<void> => {
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
      throw new Error(`Failed to delete question: ${errorText}`);
    }
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};