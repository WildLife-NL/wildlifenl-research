const TEST_BASE_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl';
const BASE_URL = process.env.NODE_ENV === 'test'
  ? TEST_BASE_URL
  : process.env.REACT_APP_BASE_URL;

const RESPONSE_EXPERIMENT_API_URL = `${BASE_URL}/responses/experiment/`;
const RESPONSE_QUESTIONNAIRE_API_URL = `${BASE_URL}/responses/questionnaire/`;


const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getResponsesByExperimentID = async (id: string): Promise<any[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${RESPONSE_EXPERIMENT_API_URL}${id}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch responses: ${errorText}`);
    }

    // Return raw JSON for dynamic fields
    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching responses:', error);
    throw error;
  }
};

export const getResponsesByQuestionnaireID = async (id: string): Promise<any[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${RESPONSE_QUESTIONNAIRE_API_URL}${id}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch responses: ${errorText}`);
    }

    // Return raw JSON for dynamic fields
    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching responses:', error);
    throw error;
  }
};