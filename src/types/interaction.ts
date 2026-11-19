import { InteractionType } from './interactiontype';
import { Location } from './location';
import { Questionnaire } from './questionnaire';
import { Species } from './species';
import { UserApp } from './user';

// An interaction as the API sends it, the report fields depend on its type and stay untyped
export interface Interaction {
  ID: string;
  location: Location;
  moment?: string;
  notes?: string;
  place?: Location;
  questionnaire?: Questionnaire | null;
  species: Species;
  speciesID?: Species['ID'];
  timestamp: string;
  type: InteractionType;
  typeID?: number;
  user: UserApp;
}
