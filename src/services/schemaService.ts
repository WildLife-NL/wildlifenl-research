import { API_BASE_URL } from '../apiBaseUrl';

// Get the minimum length the API requires for a field, or undefined when the schema sets none.
// Throws when the schema cannot be loaded or does not describe the field, so validation is never skipped silently.
export const getMinLength = async (schemaName: string, field: string): Promise<number | undefined> => {
  try {
    const response = await fetch(`${API_BASE_URL}/schemas/${schemaName}.json`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${schemaName} schema (status ${response.status})`);
    }

    const schema = await response.json();
    const property = schema?.properties?.[field];
    if (!property) {
      throw new Error(`${schemaName} schema does not describe ${field}`);
    }
    if (property.minLength === undefined) {
      return undefined;
    }
    if (!Number.isInteger(property.minLength) || property.minLength < 0) {
      throw new Error(`${schemaName} schema has an invalid minLength for ${field}`);
    }
    return property.minLength;
  } catch (error) {
    console.error('Get schema error:', error);
    throw new Error(`Could not load the validation rules for ${schemaName} ${field}. Please try again.`);
  }
};
