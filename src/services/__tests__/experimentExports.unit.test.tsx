import { getInteractionsByExperimentID, getInteractionsWithQuestionnaireByExperimentID } from '../interactionService';
import { getTrackingReadingsByExperimentID } from '../trackingReadingService';
import { getContactsByExperimentID } from '../contactService';
import { loadContactRows, loadUserLocationRows } from '../exportService';
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
    await expect(getContactsByExperimentID('experiment-1')).rejects.toThrow(NOT_ON_THIS_API);
  });

  test('THROWS WITHOUT A TOKEN AND DOES NOT CALL THE API', async () => {
    localStorage.clear();

    await expect(getTrackingReadingsByExperimentID('experiment-1')).rejects.toThrow('No authentication token found');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('KEEPS ONLY THE INTERACTIONS THAT GOT A QUESTIONNAIRE OF THIS EXPERIMENT', async () => {
    fetchMock.mockResolvedValue(
      apiResponse(200, [
        { ID: 'from-this-experiment', questionnaire: { ID: 'questionnaire-1', name: 'Testing', experiment: { ID: 'experiment-1' } } },
        { ID: 'without-questionnaire' },
        { ID: 'null-questionnaire', questionnaire: null },
        { ID: 'from-another-experiment', questionnaire: { ID: 'questionnaire-2', name: 'Testing', experiment: { ID: 'experiment-2' } } },
        { ID: 'by-experiment-id', questionnaire: { ID: 'questionnaire-3', name: 'Testing', experimentID: 'experiment-1' } },
      ])
    );

    const interactions = await getInteractionsWithQuestionnaireByExperimentID('experiment-1');
    expect(interactions.map((interaction) => interaction.ID)).toEqual(['from-this-experiment', 'by-experiment-id']);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/interactions\/experiment\/experiment-1$/), expect.anything());
  });

  test('GETS THE CONTACTS OF AN EXPERIMENT AND TREATS NULL AS NONE', async () => {
    fetchMock.mockResolvedValue(apiResponse(200, null));

    await expect(getContactsByExperimentID('experiment-1')).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/contacts\/experiment\/experiment-1$/),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer testing-token' }) })
    );
  });

  test('CONTACT ROWS ARE NEWEST FIRST WITH THE ANIMAL, COLLAR AND PLACES', async () => {
    const deployment = {
      sensorID: 'sensor-1',
      contactHardwareAddress: 'AA:BB:CC:DD:EE:FF',
      animalID: 'animal-1',
      animal: { ID: 'animal-1', name: 'Testing fox', species: { ID: 'species-fox', name: 'Vulpes vulpes', commonName: 'Vos' } },
    };
    fetchMock.mockResolvedValue(
      apiResponse(200, [
        {
          ID: 'contact-old',
          start: '2026-06-11T09:00:00Z',
          end: '2026-06-11T09:05:00Z',
          startLocation: { latitude: 51.69, longitude: 5.27 },
          endLocation: { latitude: 51.691, longitude: 5.271 },
          user: { ID: 'user-1', name: 'Testing Reporter' },
          borneSensorDeployment: deployment,
          conveyances: [{ ID: 'conveyance-1' }],
        },
        // Still going on, recorded before the API stored locations (the north pole)
        {
          ID: 'contact-new',
          start: '2026-06-12T10:00:00Z',
          end: null,
          startLocation: { latitude: 90, longitude: 0 },
          user: { ID: 'user-2', name: 'user-2' },
          borneSensorDeployment: { sensorID: 'sensor-2', animalID: 'animal-2' },
          conveyances: null,
        },
      ])
    );

    const rows = await loadContactRows('experiment-1');
    expect(rows.map((row) => row.contactID)).toEqual(['contact-new', 'contact-old']);
    expect(rows[1]).toEqual({
      contactID: 'contact-old',
      start: '2026-06-11T09:00:00Z',
      end: '2026-06-11T09:05:00Z',
      userID: 'user-1',
      userName: 'Testing Reporter',
      animalID: 'animal-1',
      animalName: 'Testing fox',
      species: 'Vulpes vulpes',
      commonName: 'Vos',
      sensorID: 'sensor-1',
      contactHardwareAddress: 'AA:BB:CC:DD:EE:FF',
      startLatitude: 51.69,
      startLongitude: 5.27,
      endLatitude: 51.691,
      endLongitude: 5.271,
      deliveredMessages: 1,
    });
    expect(rows[0]).toMatchObject({ end: '', animalID: 'animal-2', startLatitude: '', startLongitude: '', endLatitude: '', deliveredMessages: 0 });
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
