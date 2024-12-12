import { Experiment } from "./experiment";
import { AddAnswer } from "./answer";
import { Species } from "./species";

export interface Message{
  ID: string;
  answer: AddAnswer;
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