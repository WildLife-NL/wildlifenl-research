import { Experiment } from '../types/experiment';

const API_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl/experiments/';

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Add Experiment
export const addExperiment = async (experimentData: any): Promise<Experiment> => {
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
      body: JSON.stringify(experimentData),
    });

    console.log('Add Experiment response:', response);

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json();
      console.error('Failed to add experiment:', errorData);
      throw new Error('Failed to add experiment');
    }
  } catch (error) {
    console.error('Add Experiment error:', error);
    throw error;
  }
};

// Get All Experiments
export const getExperiments = async (): Promise<Experiment[]> => {
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

    console.log('Get All Experiments response:', response);

    if (response.ok) {
      const data = await response.json();
      return data; // Should match the Experiment[] type
    } else {
      const errorData = await response.json();
      console.error('Failed to fetch experiments:', errorData);
      throw new Error('Failed to fetch experiments');
    }
  } catch (error) {
    console.error('Get Experiments error:', error);
    throw error;
  }
};

// Get Experiment By ID
export const getExperimentByID = async (id: string): Promise<Experiment> => {
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

    console.log(`Get Experiment By ID (${id}) response:`, response);

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json();
      console.error(`Failed to fetch experiment with ID ${id}:`, errorData);
      throw new Error('Failed to fetch experiment by ID');
    }
  } catch (error) {
    console.error(`Get Experiment By ID (${id}) error:`, error);
    throw error;
  }
};

// Get My Experiments
export const getMyExperiments = async (): Promise<Experiment[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}me/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Get My Experiments response:', response);

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json();
      console.error('Failed to fetch my experiments:', errorData);
      throw new Error('Failed to fetch my experiments');
    }
  } catch (error) {
    console.error('Get My Experiments error:', error);
    throw error;
  }
};