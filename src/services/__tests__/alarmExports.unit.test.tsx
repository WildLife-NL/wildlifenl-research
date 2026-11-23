import { getAllAlarms } from '../alarmService';
import { loadAlarmRows } from '../exportService';
import { LivingLab } from '../../types/livinglab';

// The alarms export: the API returns every alarm, the area, period and species filters run in the browser

const apiResponse = (status: number, body: any, contentType = 'application/json') =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? contentType : null) },
    json: async () => body,
  }) as unknown as Response;

const square = (south: number, west: number, north: number, east: number) => [
  { latitude: south, longitude: west },
  { latitude: north, longitude: west },
  { latitude: north, longitude: east },
  { latitude: south, longitude: east },
];

const lab: LivingLab = { $schema: '', ID: 'lab-1', name: 'Testing lab', definition: square(52.0, 5.0, 52.1, 5.1) };

const fox = { ID: 'species-fox', name: 'Vulpes vulpes', commonName: 'Vos' };
const wolf = { ID: 'species-wolf', name: 'Canis lupus', commonName: 'Wolf' };

const zoneInLab = { ID: 'zone-in', name: 'Testing zone in lab', definition: square(52.05, 5.05, 52.06, 5.06), user: { ID: 'user-1', name: 'Testing Owner' } };
const zoneElsewhere = { ID: 'zone-out', name: 'Testing zone elsewhere', definition: square(53.0, 6.0, 53.1, 6.1), user: { ID: 'user-1', name: 'Testing Owner' } };

// The animal's location is where it is now, far from the lab, so only its zone can place the alarm
const animalAlarm = {
  ID: 'alarm-animal',
  timestamp: '2026-03-16T10:04:44Z',
  zone: zoneInLab,
  animal: { ID: 'animal-1', identifier: 'Testing fox', species: fox, location: { latitude: 52.4, longitude: 4.6 } },
  conveyances: [{ ID: 'conveyance-1' }],
};

const detectionInLab = {
  ID: 'alarm-detection-in',
  timestamp: '2026-10-18T21:56:53Z',
  zone: zoneElsewhere,
  detection: { ID: 'detection-1', deploymentID: 'Testing-Detector', sensorType: 'visual', location: { latitude: 52.07, longitude: 5.07 }, species: wolf },
  conveyances: [],
};

// Its zone overlaps the lab, but the detection itself happened outside it
const detectionOutsideLab = {
  ID: 'alarm-detection-out',
  timestamp: '2026-06-01T12:00:00Z',
  zone: zoneInLab,
  detection: { ID: 'detection-2', deploymentID: 'Testing-Detector', location: { latitude: 52.3, longitude: 5.3 }, species: wolf },
  conveyances: null,
};

// An interaction without a place falls back to where it was reported
const interactionAlarm = {
  ID: 'alarm-interaction',
  timestamp: '2026-06-30T13:23:08Z',
  zone: zoneElsewhere,
  interaction: {
    ID: 'interaction-1',
    location: { latitude: 52.02, longitude: 5.02 },
    place: { latitude: 0, longitude: 0 },
    species: fox,
    type: { ID: 1, name: 'Waarneming' },
  },
  conveyances: [],
};

const allAlarms = [animalAlarm, detectionInLab, detectionOutsideLab, interactionAlarm];

const ids = (rows: { alarmID: string }[]) => rows.map((row) => row.alarmID);

describe('alarm exports - Unit Tests', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue(apiResponse(200, allAlarms));
    global.fetch = fetchMock;
    localStorage.setItem('authToken', 'testing-token');
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test('GETS ALL ALARMS WITH THE TOKEN AND TREATS NULL AS NONE', async () => {
    await expect(getAllAlarms()).resolves.toHaveLength(4);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/alarms\/$/),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer testing-token' }) })
    );

    fetchMock.mockResolvedValue(apiResponse(200, null));
    await expect(getAllAlarms()).resolves.toEqual([]);
  });

  test('WITHOUT FILTERS EVERY ALARM IS A ROW, NEWEST FIRST', async () => {
    const rows = await loadAlarmRows({});
    expect(ids(rows)).toEqual(['alarm-detection-in', 'alarm-interaction', 'alarm-detection-out', 'alarm-animal']);
  });

  test('AN AREA KEEPS ALARMS WHOSE DETECTION OR REPORT WAS INSIDE IT, AND ANIMAL ALARMS WHOSE ZONE OVERLAPS IT', async () => {
    const rows = await loadAlarmRows({ livingLab: lab });
    expect(ids(rows)).toEqual(['alarm-detection-in', 'alarm-interaction', 'alarm-animal']);
  });

  test('THE PERIOD AND SPECIES FILTERS COMBINE', async () => {
    const june = { start: '2026-06-01T00:00:00.000Z', end: '2026-06-30T23:59:59.999Z' };
    expect(ids(await loadAlarmRows(june))).toEqual(['alarm-interaction', 'alarm-detection-out']);
    expect(ids(await loadAlarmRows({ ...june, speciesID: 'species-fox' }))).toEqual(['alarm-interaction']);
    expect(ids(await loadAlarmRows({ start: '2026-07-01T00:00:00.000Z' }))).toEqual(['alarm-detection-in']);
    expect(ids(await loadAlarmRows({ end: '2026-04-01T00:00:00.000Z', speciesID: 'species-wolf' }))).toEqual([]);
  });

  test('A ROW NAMES WHAT RAISED THE ALARM, ITS SPECIES, ZONE AND PLACE', async () => {
    const rows = await loadAlarmRows({});
    const byId = Object.fromEntries(rows.map((row) => [row.alarmID, row]));

    expect(byId['alarm-animal']).toMatchObject({
      raisedBy: 'animal',
      species: 'Vulpes vulpes',
      commonName: 'Vos',
      zoneName: 'Testing zone in lab',
      zoneOwner: 'Testing Owner',
      animalName: 'Testing fox',
      latitude: '',
      longitude: '',
      deliveredMessages: 1,
    });
    expect(byId['alarm-detection-in']).toMatchObject({ raisedBy: 'detection', deploymentID: 'Testing-Detector', sensorType: 'visual', latitude: 52.07 });
    expect(byId['alarm-interaction']).toMatchObject({ raisedBy: 'interaction', interactionType: 'Waarneming', latitude: 52.02, longitude: 5.02 });
    expect(byId['alarm-detection-out'].deliveredMessages).toBe(0);
  });

  test('A LIVING LAB WITHOUT AN AREA IS AN ERROR, NOT AN EMPTY FILE', async () => {
    await expect(loadAlarmRows({ livingLab: { ...lab, definition: [] } })).rejects.toThrow('This LivingLab has no area defined.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('THROWS THE API PROBLEM DETAIL', async () => {
    fetchMock.mockResolvedValue(apiResponse(403, { title: 'Forbidden', detail: 'Missing scope.' }, 'application/problem+json'));
    await expect(loadAlarmRows({})).rejects.toThrow('Missing scope.');
  });
});
