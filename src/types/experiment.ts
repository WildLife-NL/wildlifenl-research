import { LivingLab } from './livinglab';
import { User } from './user';

export interface Experiment {
  $schema: string;
  ID: string;
  name: string;
  description: string;
  start: string;
  end: string;
  user: User;
  livingLab: LivingLab;
  responses?: number;
  questionnaires?: number;
  messages?: number;
}