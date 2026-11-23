import { Location } from "./location";
import { Species } from "./species";
import { UserApp } from "./user";

export interface DetectionAnimal {
  behaviour?: string;
  condition?: string;
  confidence?: number;
  description?: string;
  lifeStage?: string;
  sex?: string;
}

export interface Detection {
  ID: string;
  start: string;
  end: string;
  location: Location;
  species: Species;
  sensorType?: string | null;
  deploymentID: string;
  uri?: string;
  user: UserApp;
  animals?: DetectionAnimal[] | null;
}
