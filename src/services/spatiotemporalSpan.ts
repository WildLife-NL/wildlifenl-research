import { Coordinate, LivingLab } from '../types/livinglab';

export interface SpatiotemporalSpan {
  start: string;
  end: string;
  latitude: number;
  longitude: number;
  radius: number;
}

// The API accepts a radius of at most 10 km per request
const MAX_RADIUS = 10000;
const METERS_PER_DEGREE_LATITUDE = 111320;

export const toSpanQuery = (span: SpatiotemporalSpan): string =>
  new URLSearchParams({
    start: span.start,
    end: span.end,
    latitude: span.latitude.toString(),
    longitude: span.longitude.toString(),
    radius: Math.ceil(span.radius).toString(),
  }).toString();

// Spans that together cover the whole area of a living lab, larger living labs are split into a grid
export const getLivingLabSpans = (livingLab: LivingLab, start: string, end: string): SpatiotemporalSpan[] => {
  const polygon = livingLab.definition || [];
  if (polygon.length === 0) return [];

  const minLatitude = Math.min(...polygon.map((point) => point.latitude));
  const maxLatitude = Math.max(...polygon.map((point) => point.latitude));
  const minLongitude = Math.min(...polygon.map((point) => point.longitude));
  const maxLongitude = Math.max(...polygon.map((point) => point.longitude));

  const centerLatitude = (minLatitude + maxLatitude) / 2;
  const metersPerDegreeLongitude = METERS_PER_DEGREE_LATITUDE * Math.cos((centerLatitude * Math.PI) / 180);
  const width = (maxLongitude - minLongitude) * metersPerDegreeLongitude;
  const height = (maxLatitude - minLatitude) * METERS_PER_DEGREE_LATITUDE;

  const halfDiagonal = Math.hypot(width, height) / 2;
  if (halfDiagonal <= MAX_RADIUS) {
    return [{
      start,
      end,
      latitude: centerLatitude,
      longitude: (minLongitude + maxLongitude) / 2,
      radius: Math.max(1, halfDiagonal),
    }];
  }

  const columns = Math.ceil(width / MAX_RADIUS);
  const rows = Math.ceil(height / MAX_RADIUS);
  const cellWidth = (maxLongitude - minLongitude) / columns;
  const cellHeight = (maxLatitude - minLatitude) / rows;

  const spans: SpatiotemporalSpan[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      spans.push({
        start,
        end,
        latitude: minLatitude + (row + 0.5) * cellHeight,
        longitude: minLongitude + (column + 0.5) * cellWidth,
        radius: MAX_RADIUS,
      });
    }
  }
  return spans;
};

// Ray casting, a point exactly on an edge may fall either way
export const isInPolygon = (point: Coordinate, polygon: Coordinate[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (
      (a.latitude > point.latitude) !== (b.latitude > point.latitude) &&
      point.longitude < ((b.longitude - a.longitude) * (point.latitude - a.latitude)) / (b.latitude - a.latitude) + a.longitude
    ) {
      inside = !inside;
    }
  }
  return inside;
};

export const isInLivingLab = (point: Coordinate, livingLab: LivingLab): boolean => isInPolygon(point, livingLab.definition || []);

// Which side of the line from a to b the point c is on
const orientation = (a: Coordinate, b: Coordinate, c: Coordinate): number =>
  Math.sign((b.longitude - a.longitude) * (c.latitude - a.latitude) - (b.latitude - a.latitude) * (c.longitude - a.longitude));

const segmentsCross = (a: Coordinate, b: Coordinate, c: Coordinate, d: Coordinate): boolean =>
  orientation(a, b, c) * orientation(a, b, d) < 0 && orientation(c, d, a) * orientation(c, d, b) < 0;

// Two areas overlap when a corner of one lies inside the other or their edges cross
export const polygonsOverlap = (first: Coordinate[], second: Coordinate[]): boolean => {
  if (first.length < 3 || second.length < 3) return false;
  if (first.some((point) => isInPolygon(point, second)) || second.some((point) => isInPolygon(point, first))) return true;
  return first.some((a, i) => {
    const b = first[(i + 1) % first.length];
    return second.some((c, j) => segmentsCross(a, b, c, second[(j + 1) % second.length]));
  });
};

export const isInPeriod = (timestamp: string, start: string, end: string): boolean => {
  const time = new Date(timestamp).getTime();
  return time >= new Date(start).getTime() && time <= new Date(end).getTime();
};
