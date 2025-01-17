import { Experiment, UpdateExperiment } from '../types/experiment';

const EXPERIMENT_API_URL = `${process.env.REACT_APP_BASE_URL}/experiment/`;
const EXPERIMENTS_API_URL = `${process.env.REACT_APP_BASE_URL}/experiments/`;

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

    const response = await fetch(`${EXPERIMENT_API_URL}`, {
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

    const response = await fetch(`${EXPERIMENTS_API_URL}`, {
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


// Get My Experiments
export const getMyExperiments = async (): Promise<Experiment[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${EXPERIMENTS_API_URL}me/`, {
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

// Update Experiment
export const updateExperiment = async (id: string, experimentData: UpdateExperiment): Promise<Experiment> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${EXPERIMENT_API_URL}${id}`, { 
      method: 'PUT',
      headers: {
        Accept: 'application/json, application/problem+json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(experimentData),
    });

    console.log('Update Experiment response:', response);

    if (response.ok) {
      const data = await response.json();
      return data as Experiment;
    } else {
      const errorText = await response.text();
      console.error('Failed to update experiment:', errorText);
      throw new Error(errorText);
    }
  } catch (error) {
    console.error('Update Experiment error:', error);
    throw error;
  }
};

//End Experiment
export const EndExperimentByID = async (id: string): Promise<Experiment> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${EXPERIMENT_API_URL}end/${id}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json, application/problem+json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to end experiment: ${errorText}`);
    }

    const data = await response.json();
    return data as Experiment;
  } catch (error) {
    console.error('Error ending experiment:', error);
    throw error;
  }
};

// Delete Experiment
export const DeleteExperimentByID = async (id: string): Promise<Experiment | void> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${EXPERIMENT_API_URL}${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete experiment: ${errorText}`);
    }

    // If the response is 204 No Content, there's no JSON to parse
    if (response.status === 204) {
      return;
    }

    // Otherwise, parse JSON
    const data = await response.json();
    return data as Experiment;

  } catch (error) {
    console.error('Error deleting experiment:', error);
    throw error;
  }
};