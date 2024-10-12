import { User } from '../types/user';
const API_URL = '/profile/me';


const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getMyProfile = async (): Promise<User> => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json, application/problem+json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return data as User;
  } else {
    throw new Error('Failed to fetch profile');
  }
};