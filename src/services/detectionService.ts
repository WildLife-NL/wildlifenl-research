import { Detection } from '../types/detection';
import { LivingLab } from '../types/livinglab';
import { API_BASE_URL } from '../apiBaseUrl';
import { getProblemMessage } from './problemDetails';
import { SpatiotemporalSpan, getLivingLabSpans, isInLivingLab, toSpanQuery } from './spatiotemporalSpan';

const API_URL = `${API_BASE_URL}/detections/`;

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Get Detections within a spatiotemporal span
export const getDetectionsBySpan = async (span: SpatiotemporalSpan): Promise<Detection[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}?${toSpanQuery(span)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorMessage = await getProblemMessage(response, 'Failed to fetch detections');
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching detections:', error);
    throw error;
  }
};

// Get all detections inside a living lab during a period
export const getDetectionsInLivingLab = async (livingLab: LivingLab, start: string, end: string): Promise<Detection[]> => {
  const spans = getLivingLabSpans(livingLab, start, end);
  if (spans.length === 0) {
    throw new Error('This LivingLab has no area defined.');
  }
  const detectionsPerSpan = await Promise.all(spans.map(getDetectionsBySpan));

  const detections = new Map<string, Detection>();
  for (const spanDetections of detectionsPerSpan) {
    for (const detection of spanDetections) {
      if (detection.location && isInLivingLab(detection.location, livingLab)) {
        detections.set(detection.ID, detection);
      }
    }
  }

  return Array.from(detections.values()).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};
