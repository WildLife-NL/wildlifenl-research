import { Answer } from './answer';

export interface Question {
  ID: string;
  allowMultipleResponse: boolean;
  allowOpenResponse: boolean;
  answers: Array<Answer>;
  description: string;
  index: number;
  openResponseFormat: string;
  text: string;
}