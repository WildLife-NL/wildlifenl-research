const API_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl/triggerTypes/';


const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getAllTriggerTypes = async (): Promise<string[]> => {
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

    console.log('Get All Trigger Types response:', response);

    if (response.ok) {
      const data: string[] = await response.json();
      return data;
    } else {
      const errorData = await response.json();
      console.error('Failed to fetch all trigger types:', errorData);
      throw new Error('Failed to fetch all trigger types');
    }
  } catch (error) {
    console.error('Get All Trigger Types error:', error);
    throw error;
  }
};