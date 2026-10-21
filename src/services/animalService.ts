import { Animal, AnimalLocation } from '../types/animal';
import { LivingLab } from '../types/livinglab';
import { API_BASE_URL } from '../apiBaseUrl';
import { getProblemMessage } from './problemDetails';
import { SpatiotemporalSpan, getLivingLabSpans, isInLivingLab, isInPeriod, toSpanQuery } from './spatiotemporalSpan';

const API_URL = `${API_BASE_URL}/animals/`;

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Get Animals within a spatiotemporal span
export const getAnimalsBySpan = async (span: SpatiotemporalSpan): Promise<Animal[]> => {
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
      const errorMessage = await getProblemMessage(response, 'Failed to fetch animals');
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching animals:', error);
    throw error;
  }
};

// Get the location timeseries of all animals inside a living lab during a period
export const getAnimalLocationsInLivingLab = async (livingLab: LivingLab, start: string, end: string): Promise<AnimalLocation[]> => {
  const spans = getLivingLabSpans(livingLab, start, end);
  if (spans.length === 0) {
    throw new Error('This LivingLab has no area defined.');
  }
  const animalsPerSpan = await Promise.all(spans.map(getAnimalsBySpan));

  const locations = new Map<string, AnimalLocation>();
  for (const animals of animalsPerSpan) {
    for (const animal of animals) {
      for (const deployment of animal.borneSensorDeployments || []) {
        for (const reading of deployment.borneSensorReadings || []) {
          if (!reading.location || !isInLivingLab(reading.location, livingLab) || !isInPeriod(reading.timestamp, start, end)) {
            continue;
          }
          locations.set(`${animal.ID}|${reading.sensorID}|${reading.timestamp}`, {
            animalID: animal.ID,
            animalName: animal.name,
            species: animal.species?.name ?? '',
            commonName: animal.species?.commonName ?? '',
            sensorID: reading.sensorID,
            timestamp: reading.timestamp,
            latitude: reading.location.latitude,
            longitude: reading.location.longitude,
            altitude: reading.altitude,
            temperature: reading.temperature,
          });
        }
      }
    }
  }

  return Array.from(locations.values()).sort(
    (a, b) => a.animalName.localeCompare(b.animalName) || new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};
