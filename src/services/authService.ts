const API_URL = '/auth/';

export const requestOTP = async (email: string): Promise<Response> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, application/problem+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayNameApp: 'MyApp',
        displayNameUser: 'Jane Smith',
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
