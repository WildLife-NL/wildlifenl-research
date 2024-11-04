export interface Message{
  $schema: string;
  answerID: string;
  encounterMeters: number;
  encounterMinutes: number;
  experimentID: string;
  name: string;
  severity: number;
  speciesID: number;
  text: string;
  trigger: string;
}