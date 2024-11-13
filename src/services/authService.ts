import { getMyProfile } from './profileService';

const API_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl/auth/';


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
  } else {
    return null;
  }
};



export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('authToken');
  return !!token; 
};

export const getUserRole = async (): Promise<number | null> => {
  try {
    const profile = await getMyProfile();

    // Check if the user has the Researcher role (ID = 3)
    if (
      profile.roles &&
      profile.roles.some((role) => role.ID === 3)
    ) {
      return 3; // Researcher role ID
    }
    return null; // User does not have the Researcher role
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
};