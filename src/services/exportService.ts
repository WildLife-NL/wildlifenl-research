// Data loaders shared by the Export page and the experiment Data tab
import { getQuestionnaireByExperimentID } from './questionnaireService';
import { getResponsesByQuestionnaireID } from './responseService';
import { getDetectionsInLivingLab } from './detectionService';
import { getTrackingReadingsByExperimentID } from './trackingReadingService';
import { Questionnaire } from '../types/questionnaire';
import { LivingLab } from '../types/livinglab';

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
