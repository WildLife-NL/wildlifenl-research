import { Location } from './location';
import { Species } from './species';
import { UserApp } from './user';

// The collar of a tagged animal, its contactHardwareAddress is what the app sees over Bluetooth
export interface ContactDeployment {
  sensorID: string;
  contactHardwareAddress?: string | null;
  start?: string;
  end?: string | null;
  animalID?: string;
  animal?: { ID: string; name?: string; identifier?: string; species?: Species };
}

// A contact tracing event: an app user's phone was within Bluetooth range of a collar from start until end
export interface Contact {
  ID: string;
  start: string;
  end?: string | null;
  startLocation?: Location;
  endLocation?: Location | null;
  user: UserApp;
  borneSensorDeployment: ContactDeployment;
  conveyances?: unknown[] | null;
}
