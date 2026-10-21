import { API_BASE_URL } from '../apiBaseUrl';

export const getMinLength = async (schemaName: string, field: string): Promise<number | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/schemas/${schemaName}.json`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${schemaName} schema`);
    }

    const schema = await response.json();
    return schema.properties?.[field]?.minLength;
  } catch (error) {
    console.error('Get schema error:', error);
    return undefined;
  }
};
