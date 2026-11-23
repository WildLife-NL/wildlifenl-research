import { getMyProfile } from './profileService';
import { API_BASE_URL } from '../apiBaseUrl';
import { User } from '../types/user';
import { getRateLimitError } from './problemDetails';

const API_URL = `${API_BASE_URL}/auth/`;


export const requestOTP = async (
  email: string,
): Promise<Response> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json, application/problem+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayNameApp: 'ResearchConnect',
        email,
      }),
    });
    console.log('Fetch response:', response);
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};


export const verifyOTP = async (email: string, code: string): Promise<string | null> => {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      code,
    }),
  });

  if (response.ok) {
    const data = await response.json(); 
    return data.token;  
  }
  // The API limits sign-in requests per IP address, and a rate limit is not a wrong code
  const rateLimit = getRateLimitError(response);
  if (rateLimit) throw rateLimit;
  return null;
};



export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('authToken');
  return !!token; 
};

// True when the profile carries the Researcher role, role ID 3
export const hasResearcherRole = (profile: User): boolean =>
  !!profile.roles && profile.roles.some((role) => role.ID === 3);

export const getUserRole = async (): Promise<number | null> => {
  try {
    const profile = await getMyProfile();

    // Check if the user has the Researcher role (ID = 3)
    if (hasResearcherRole(profile)) {
      return 3; // Researcher role ID
    }
    return null; // User does not have the Researcher role
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
};
