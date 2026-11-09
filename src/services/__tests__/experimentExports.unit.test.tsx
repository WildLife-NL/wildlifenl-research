import { getInteractionsByExperimentID } from '../interactionService';
import { getTrackingReadingsByExperimentID } from '../trackingReadingService';
import { loadUserLocationRows } from '../exportService';
import { NOT_ON_THIS_API } from '../problemDetails';

// The by-experiment exports for interactions and app user locations, against a mocked API

const apiResponse = (status: number, body: any, contentType = 'application/json') =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null) },
    json: async () => body,
  }) as unknown as Response;

const reading = (userID: string, timestamp: string, latitude: number, longitude: number) => ({
  userID,
  timestamp,
  location: { latitude, longitude },
  animals: null,
  detections: null,
  interactions: null,
});

describe('experiment exports - Unit Tests', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    localStorage.setItem('authToken', 'testing-token');
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test('GETS THE TRACKING READINGS OF AN EXPERIMENT WITH THE TOKEN', async () => {
    fetchMock.mockResolvedValue(apiResponse(200, [reading('user-1', '2025-11-27T15:55:30Z', 51.42, 5.48)]));

    await expect(getTrackingReadingsByExperimentID('experiment-1')).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/tracking-readings\/experiment\/experiment-1$/),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer testing-token' }) })
    );
  });

  test('GETS THE INTERACTIONS OF AN EXPERIMENT', async () => {
    fetchMock.mockResolvedValue(apiResponse(200, [{ ID: 'interaction-1', reportOfSighting: { involvedAnimals: [{ sex: 'female' }] } }]));

    const interactions = await getInteractionsByExperimentID('experiment-1');
    expect(interactions[0].reportOfSighting.involvedAnimals[0].sex).toBe('female');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/interactions\/experiment\/experiment-1$/), expect.anything());
  });

  test('TREATS A NULL LIST AS NO ROWS', async () => {
    fetchMock.mockResolvedValue(apiResponse(200, null));

    await expect(getTrackingReadingsByExperimentID('experiment-1')).resolves.toEqual([]);
    await expect(getInteractionsByExperimentID('experiment-1')).resolves.toEqual([]);
  });

  test('THROWS THE API PROBLEM DETAIL', async () => {
    fetchMock.mockResolvedValue(apiResponse(404, { title: 'Not Found', detail: 'Experiment not found.' }, 'application/problem+json'));

    await expect(getTrackingReadingsByExperimentID('missing')).rejects.toThrow('Experiment not found.');
    await expect(getInteractionsByExperimentID('missing')).rejects.toThrow('Experiment not found.');
  });

  test('SAYS THE EXPORT IS MISSING WHEN THE API ANSWERS WITH ITS HTML DOCUMENTATION', async () => {
    fetchMock.mockResolvedValue(apiResponse(200, undefined, 'text/html; charset=utf-8'));

    await expect(getTrackingReadingsByExperimentID('experiment-1')).rejects.toThrow(NOT_ON_THIS_API);
    await expect(getInteractionsByExperimentID('experiment-1')).rejects.toThrow(NOT_ON_THIS_API);
  });

  test('THROWS WITHOUT A TOKEN AND DOES NOT CALL THE API', async () => {
    localStorage.clear();

    await expect(getTrackingReadingsByExperimentID('experiment-1')).rejects.toThrow('No authentication token found');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('USER LOCATION ROWS KEEP THE API ORDER AND ONLY THE LOCATION COLUMNS', async () => {
    fetchMock.mockResolvedValue(
      apiResponse(200, [reading('user-1', '2025-11-27T15:55:30Z', 51.42629, 5.48202), reading('user-2', '2025-11-27T15:55:23Z', 51.4263, 5.482)])
    );

    await expect(loadUserLocationRows('experiment-1')).resolves.toEqual([
      { userID: 'user-1', timestamp: '2025-11-27T15:55:30Z', latitude: 51.42629, longitude: 5.48202 },
      { userID: 'user-2', timestamp: '2025-11-27T15:55:23Z', latitude: 51.4263, longitude: 5.482 },
    ]);
  });
});
