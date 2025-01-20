import { LivingLab } from '../types/livinglab';
import { getBaseUrl } from '../config';

const TEST_BASE_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl';
const BASE_URL = process.env.NODE_ENV === 'test'
  ? TEST_BASE_URL
  : getBaseUrl();


const API_URL = `${BASE_URL}/livinglabs`;

// Function to get the auth token from local storage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Get All Living Labs
export const getAllLivingLabs = async (): Promise<LivingLab[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_URL}/livinglabs/`, {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/problem+json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return data as LivingLab[]; // Ensure the response matches the LivingLab[] type
  } else {
    throw new Error('Failed to fetch living labs');
  }
};
