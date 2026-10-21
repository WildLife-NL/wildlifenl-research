import { Species } from "./species";

export interface Animal {
  ID : string;
  location : Location;
  locationTimestamp: string;
  name : string;
  species : Species;
}
