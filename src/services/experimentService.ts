import { Experiment } from '../types/experiment';

const API_URL = '/experiments/';

// Function to get the auth token from local storage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Add Experiment
export const addExperiment = async (experimentData: any): Promise<Experiment> => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_URL}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json, application/problem+json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(experimentData),
  });

  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    throw new Error('Failed to add experiment');
  }
};
// Get All Experiments
export const getExperiments = async (): Promise<Experiment[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');
  
  const response = await fetch(`${API_URL}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/problem+json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return data; // Should match the Experiment[] type
  } else {
    throw new Error('Failed to fetch experiments');
  }
};

// Get Experiment By ID
export const getExperimentByID = async (id: string): Promise<Experiment> => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_URL}${id}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/problem+json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    throw new Error('Failed to fetch experiment by ID');
  }
};


// Get My Experiments
export const getMyExperiments = async (): Promise<Experiment[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_URL}me/`, {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/problem+json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    throw new Error('Failed to fetch my experiments');
  }
};