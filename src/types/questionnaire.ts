import { Experiment } from "./experiment";
import { InteractionType } from "./interactiontype";
import { Question } from "./question";

export interface Questionnaire{
  ID: string;
  experiment: Experiment;
  identifier: string;
  interactionType: InteractionType
  name: string;
  questions: Array<Question>;
}