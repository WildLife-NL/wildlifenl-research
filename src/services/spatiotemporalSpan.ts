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

export const isInLivingLab = (point: Coordinate, livingLab: LivingLab): boolean => {
  const polygon = livingLab.definition || [];
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

export const isInPeriod = (timestamp: string, start: string, end: string): boolean => {
  const time = new Date(timestamp).getTime();
  return time >= new Date(start).getTime() && time <= new Date(end).getTime();
};
