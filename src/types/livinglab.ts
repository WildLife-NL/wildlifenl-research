export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface LivingLab {
  $schema: string;
  ID: string;
  definition: Coordinate[];
  name: string;
}
