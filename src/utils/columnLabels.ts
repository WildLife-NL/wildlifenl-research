// Readable column headers for export previews, the CSV itself keeps the raw API names

const KNOWN_LABELS: Record<string, string> = {
  ID: 'ID',
  text: 'Typed text',
  timestamp: 'Time',
  moment: 'Happened at',
  userID: 'App user ID',
  type_name: 'Interaction type',
  answer_text: 'Answer',
  answer_index: 'Answer number',
  question_text: 'Question',
  question_index: 'Question number',
  question_description: 'Question description',
  interaction_timestamp: 'Reported at',
  interaction_user_name: 'App user',
  interaction_user_ID: 'App user ID',
  interaction_location_latitude: 'Latitude',
  interaction_location_longitude: 'Longitude',
  interaction_type_name: 'Interaction type',
  user_name: 'App user',
  user_ID: 'App user ID',
  message_name: 'Message',
  message_text: 'Message text',
  message_severity: 'Severity',
  message_trigger: 'Trigger',
  animal_name: 'Animal',
  animal_species_commonName: 'Species',
  location_latitude: 'Latitude',
  location_longitude: 'Longitude',
  commonName: 'Common name',
  sensorType: 'Sensor type',
  deploymentID: 'Deployment ID',
  detectionID: 'Detection ID',
  lifeStage: 'Life stage',
};

// "nextQuestionID" becomes "next question ID", "ID" stays "ID"
const humanizeSegment = (segment: string): string =>
  segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(' ')
    .map((word) => (/^[A-Z0-9]+$/.test(word) && word.length > 1 ? word : word.toLowerCase()))
    .join(' ');

const capitalize = (value: string): string => (value ? value[0].toUpperCase() + value.slice(1) : value);

// Known API keys get a plain name, other nested keys read as "Interaction › location › latitude"
export const humanizeColumn = (key: string): string => {
  if (KNOWN_LABELS[key]) return KNOWN_LABELS[key];
  return capitalize(key.split('_').filter(Boolean).map(humanizeSegment).join(' › '));
};
