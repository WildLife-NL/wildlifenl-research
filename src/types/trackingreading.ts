import { Location } from './location';

export interface TrackingReading {
  userID: string;
  timestamp: string;
  location: Location;
}
