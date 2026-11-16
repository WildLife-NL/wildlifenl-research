import { API_BASE_URL } from '../apiBaseUrl';
import { Experiment } from '../types/experiment';
import { getProblemMessage, getRateLimitError, isRateLimited, RateLimitError } from './problemDetails';

const RESPONSE_EXPERIMENT_API_URL = `${API_BASE_URL}/responses/experiment/`;
const RESPONSE_QUESTIONNAIRE_API_URL = `${API_BASE_URL}/responses/questionnaire/`;


const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getResponsesByExperimentID = async (id: string): Promise<any[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${RESPONSE_EXPERIMENT_API_URL}${id}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw getRateLimitError(response) ?? new Error(await getProblemMessage(response, 'Failed to fetch responses'));
    }

    // Return raw JSON for dynamic fields
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching responses:', error);
    throw error;
  }
};

export const getResponsesByQuestionnaireID = async (id: string): Promise<any[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${RESPONSE_QUESTIONNAIRE_API_URL}${id}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw getRateLimitError(response) ?? new Error(await getProblemMessage(response, 'Failed to fetch responses'));
    }

    // Return raw JSON for dynamic fields
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching responses:', error);
    throw error;
  }
};

export const getResponseCountByExperimentID = async (id: string): Promise<number> => {
  const responses = await getResponsesByExperimentID(id);
  return responses.length;
};

// Adds the response count to each experiment that has none yet, a count the API could not give stays undefined
export const addResponseCounts = async (experiments: Experiment[]): Promise<{ experiments: Experiment[]; rateLimit: RateLimitError | null }> => {
  let rateLimit: RateLimitError | null = null;
  const counted = await Promise.all(
    experiments.map(async (experiment) => {
      if (experiment.responses !== undefined) return experiment;
      try {
        return { ...experiment, responses: await getResponseCountByExperimentID(experiment.ID) };
      } catch (error) {
        if (isRateLimited(error)) rateLimit = error;
        return experiment;
      }
    })
  );
  return { experiments: counted, rateLimit };
};
