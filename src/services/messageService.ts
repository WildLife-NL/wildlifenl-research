import { Message } from '../types/message';
const TEST_BASE_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl';
const BASE_URL = process.env.NODE_ENV === 'test'
  ? TEST_BASE_URL
  : process.env.REACT_APP_BASE_URL;
const MESSAGE_API_URL = `${BASE_URL}/message/`;
const MESSAGES_API_URL = `${BASE_URL}/messages/experiment/`;

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Add Message
export const addMessage = async (messageData: any): Promise<Message> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${MESSAGE_API_URL}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json, application/problem+json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(messageData),
    });

    console.log('Add Message response:', response);

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Failed to add message';
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } else {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      console.error('Failed to add message:', errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Add Message error:', error);
    throw error;
  }
};

export const getMessagesByExperimentID = async (id: string): Promise<Message[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${MESSAGES_API_URL}${id}`, {
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
    return data as Message[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

// Delete Message
export const DeleteMessageByID = async (id: string): Promise<Message | void> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${MESSAGE_API_URL}${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete Message: ${errorText}`);
    }

    // If the response is 204 No Content, there's no JSON to parse
    if (response.status === 204) {
      return;
    }

    // Otherwise, parse JSON
    const data = await response.json();
    return data as Message;

  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};