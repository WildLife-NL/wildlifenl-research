// Data loaders shared by the Export page and the experiment Data tab
import { getQuestionnaireByExperimentID } from './questionnaireService';
import { getResponsesByQuestionnaireID } from './responseService';
import { getDetectionsInLivingLab } from './detectionService';
import { getTrackingReadingsByExperimentID } from './trackingReadingService';
import { getAllAlarms } from './alarmService';
import { isInLivingLab, polygonsOverlap } from './spatiotemporalSpan';
import { Questionnaire } from '../types/questionnaire';
import { Coordinate, LivingLab } from '../types/livinglab';
import { Alarm } from '../types/alarm';

// responsesById holds null for a questionnaire whose responses could not be loaded
export interface QuestionnaireExports {
  questionnaires: Questionnaire[];
  responsesById: Record<string, any[] | null>;
}

// Questionnaires of an experiment with each one's responses, so the counts and previews come from one load
export const loadQuestionnaireExports = async (experimentID: string): Promise<QuestionnaireExports> => {
  const questionnaires = (await getQuestionnaireByExperimentID(experimentID)) ?? [];
  const responses = await Promise.all(
    questionnaires.map((questionnaire) =>
      getResponsesByQuestionnaireID(questionnaire.ID).catch((error) => {
        console.error('Error fetching questionnaire responses:', error);
        return null;
      })
    )
  );
  const responsesById: Record<string, any[] | null> = {};
  questionnaires.forEach((questionnaire, index) => {
    responsesById[questionnaire.ID] = responses[index] === null ? null : responses[index] ?? [];
  });
  return { questionnaires, responsesById };
};

// One row per detected animal, the detection columns are repeated for every animal
export const loadDetectionRows = async (livingLab: LivingLab, start: string, end: string): Promise<any[]> => {
  const detections = await getDetectionsInLivingLab(livingLab, start, end);
  return detections.flatMap((detection) => {
    const animals = detection.animals?.length ? detection.animals : [{}];
    return animals.map((animal: any) => ({
      detectionID: detection.ID,
      start: detection.start,
      end: detection.end,
      latitude: detection.location?.latitude,
      longitude: detection.location?.longitude,
      species: detection.species?.name,
      commonName: detection.species?.commonName,
      sensorType: detection.sensorType ?? '',
      deploymentID: detection.deploymentID,
      owner: detection.user?.name,
      uri: detection.uri,
      sex: animal.sex,
      lifeStage: animal.lifeStage,
      condition: animal.condition,
      behaviour: animal.behaviour,
      confidence: animal.confidence,
      description: animal.description,
    }));
  });
};

// One row per location reading of an app user, the animals, detections and interactions near it are only filled in for the app
export const loadUserLocationRows = async (experimentID: string): Promise<any[]> => {
  const readings = await getTrackingReadingsByExperimentID(experimentID);
  return readings.map((reading) => ({
    userID: reading.userID,
    timestamp: reading.timestamp,
    latitude: reading.location?.latitude,
    longitude: reading.location?.longitude,
  }));
};

// Every part is optional, start and end are ISO timestamps
export interface AlarmFilter {
  livingLab?: LivingLab | null;
  start?: string | null;
  end?: string | null;
  speciesID?: string | null;
}

const alarmSource = (alarm: Alarm): string =>
  alarm.animal ? 'animal' : alarm.detection ? 'detection' : alarm.interaction ? 'interaction' : '';

const alarmSpecies = (alarm: Alarm) => alarm.animal?.species ?? alarm.detection?.species ?? alarm.interaction?.species;

// Where the detection or the reported interaction happened, a tagged animal only comes with where it is now
const alarmLocation = (alarm: Alarm): Coordinate | null => {
  if (alarm.detection?.location) return alarm.detection.location;
  const place = alarm.interaction?.place;
  if (place && (place.latitude || place.longitude)) return place;
  return alarm.interaction?.location ?? null;
};

// By its location when it has one, otherwise by its zone overlapping the living lab
export const isAlarmInLivingLab = (alarm: Alarm, livingLab: LivingLab): boolean => {
  const location = alarmLocation(alarm);
  return location ? isInLivingLab(location, livingLab) : polygonsOverlap(alarm.zone?.definition ?? [], livingLab.definition ?? []);
};

export const filterAlarms = (alarms: Alarm[], filter: AlarmFilter): Alarm[] => {
  const start = filter.start ? new Date(filter.start).getTime() : -Infinity;
  const end = filter.end ? new Date(filter.end).getTime() : Infinity;
  return alarms.filter((alarm) => {
    const time = new Date(alarm.timestamp).getTime();
    return (
      time >= start &&
      time <= end &&
      (!filter.speciesID || alarmSpecies(alarm)?.ID === filter.speciesID) &&
      (!filter.livingLab || isAlarmInLivingLab(alarm, filter.livingLab))
    );
  });
};

// One row per alarm, the columns of the animal, detection or interaction that raised it stay empty for the other two
export const toAlarmRow = (alarm: Alarm) => {
  const species = alarmSpecies(alarm);
  const location = alarmLocation(alarm);
  return {
    alarmID: alarm.ID,
    timestamp: alarm.timestamp,
    raisedBy: alarmSource(alarm),
    species: species?.name ?? '',
    commonName: species?.commonName ?? '',
    zoneID: alarm.zone?.ID,
    zoneName: alarm.zone?.name,
    zoneOwner: alarm.zone?.user?.name ?? '',
    latitude: location?.latitude ?? '',
    longitude: location?.longitude ?? '',
    animalID: alarm.animal?.ID ?? '',
    animalName: alarm.animal?.name ?? alarm.animal?.identifier ?? '',
    detectionID: alarm.detection?.ID ?? '',
    deploymentID: alarm.detection?.deploymentID ?? '',
    sensorType: alarm.detection?.sensorType ?? '',
    interactionID: alarm.interaction?.ID ?? '',
    interactionType: alarm.interaction?.type?.name ?? '',
    deliveredMessages: alarm.conveyances?.length ?? 0,
  };
};

// The alarms that match the filter, newest first
export const loadAlarmRows = async (filter: AlarmFilter): Promise<ReturnType<typeof toAlarmRow>[]> => {
  if (filter.livingLab && !filter.livingLab.definition?.length) {
    throw new Error('This LivingLab has no area defined.');
  }
  const alarms = filterAlarms(await getAllAlarms(), filter);
  return alarms.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(toAlarmRow);
};
