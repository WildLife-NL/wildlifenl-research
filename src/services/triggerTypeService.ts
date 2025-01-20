const TEST_BASE_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl';
const BASE_URL = process.env.NODE_ENV === 'test'
  ? TEST_BASE_URL
  : process.env.REACT_APP_BASE_URL;

const API_URL = `${BASE_URL}/schemas/Message.json`;


export const getAllTriggerTypes = async (): Promise<string[]> => {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
      },
    });

    console.log('Fetch Schema response:', response);

    if (response.ok) {
      const data = await response.json();
      const triggerEnum: string[] = data.properties.trigger.enum;
      if (!triggerEnum || !Array.isArray(triggerEnum)) {
        throw new Error('Trigger enum not found in schema');
      }
      return triggerEnum;
    } else {
      const errorData = await response.json();
      console.error('Failed to fetch schema:', errorData);
      throw new Error('Failed to fetch schema');
    }
  } catch (error) {
    console.error('Get All Trigger Types error:', error);
    throw error;
  }
};