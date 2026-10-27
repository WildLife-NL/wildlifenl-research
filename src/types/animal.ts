import { Species } from "./species";
import { Location } from "./location";

export interface BorneSensorReading {
  sensorID: string;
  timestamp: string;
  location?: Location;
  altitude?: number;
  temperature?: number;
}

export interface BorneSensorDeployment {
  sensorID: string;
  start: string;
  end?: string | null;
  borneSensorReadings?: BorneSensorReading[] | null;
}

export interface Animal {
  ID : string;
  location : Location;
  locationTimestamp: string;
  name : string;
  species : Species;
  borneSensorDeployments?: BorneSensorDeployment[] | null;
}

export interface AnimalLocation {
  animalID: string;
  animalName: string;
  species: string;
  commonName: string;
  sensorID: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  temperature?: number;
}
