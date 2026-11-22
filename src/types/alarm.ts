import { Detection } from './detection';
import { Interaction } from './interaction';
import { Coordinate } from './livinglab';
import { Location } from './location';
import { Species } from './species';
import { UserApp } from './user';

// An area a user drew in the app, WildlifeNL raises an alarm when an animal of one of its species comes into it
export interface Zone {
  ID: string;
  name: string;
  definition: Coordinate[] | null;
  species?: Species[] | null;
  user?: UserApp;
  created?: string;
  deactivated?: string;
}

// The API sends the animal's identifier instead of its name here, and its current location rather than the one at the alarm
export interface AlarmAnimal {
  ID: string;
  name?: string;
  identifier?: string;
  species?: Species;
  location?: Location;
}

// Exactly one of animal, detection and interaction raised the alarm
export interface Alarm {
  ID: string;
  timestamp: string;
  zone: Zone;
  animal?: AlarmAnimal | null;
  detection?: Detection | null;
  interaction?: Interaction | null;
  conveyances?: unknown[] | null;
}
