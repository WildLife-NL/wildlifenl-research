const API_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl/conveyances/experiment/';
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getConveyancesByExperimentID = async (id: string): Promise<any[]> => {
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
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch responses: ${errorText}`);
    }
    const data = await response.json();
    return data as any[];

  } catch (error) {
    console.error('Error fetching responses:', error);
    throw error;
  }
};
