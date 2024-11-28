import { Experiment } from "./experiment";
import { Answer } from "./answer";
import { Species } from "./species";

export interface Message{
  ID: string;
  answer: Answer;
  encounterMeters: number;
  encounterMinutes: number;
  experiment: Experiment;
  name: string;
  severity: number;
  species: Species;
  text: string;
  trigger: string;
  activity: number;
}