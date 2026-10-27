import { getLivingLabSpans, isInLivingLab, toSpanQuery } from '../spatiotemporalSpan';
import { LivingLab } from '../../types/livinglab';

const START = '2026-01-01T00:00:00.000Z';
const END = '2026-02-01T00:00:00.000Z';

const makeLivingLab = (definition: { latitude: number; longitude: number }[]): LivingLab => ({
  $schema: '',
  ID: 'lab',
  name: 'Lab',
  definition,
});

const distanceInMeters = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLatitude = toRadians(b.latitude - a.latitude);
  const dLongitude = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLongitude / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};

const smallLab = makeLivingLab([
  { latitude: 52.086, longitude: 5.168 },
  { latitude: 52.089, longitude: 5.168 },
  { latitude: 52.089, longitude: 5.174 },
  { latitude: 52.086, longitude: 5.174 },
]);

// Roughly 30 km wide and 20 km high, too large for a single span
const largeLab = makeLivingLab([
  { latitude: 51.1, longitude: 5.6 },
  { latitude: 51.28, longitude: 5.6 },
  { latitude: 51.28, longitude: 6.03 },
  { latitude: 51.1, longitude: 6.03 },
]);

describe('spatiotemporalSpan - Unit Tests', () => {
  test('A SMALL LIVINGLAB IS COVERED BY ONE SPAN', () => {
    const spans = getLivingLabSpans(smallLab, START, END);

    expect(spans).toHaveLength(1);
    expect(spans[0].start).toBe(START);
    expect(spans[0].end).toBe(END);
    smallLab.definition.forEach((point) => {
      expect(distanceInMeters(spans[0], point)).toBeLessThanOrEqual(spans[0].radius);
    });
  });

  test('A LARGE LIVINGLAB IS SPLIT INTO SPANS WITHIN THE API RADIUS LIMIT', () => {
    const spans = getLivingLabSpans(largeLab, START, END);

    expect(spans.length).toBeGreaterThan(1);
    spans.forEach((span) => expect(span.radius).toBeLessThanOrEqual(10000));

    // Every point of a grid over the living lab must be inside at least one span
    for (let latitude = 51.1; latitude <= 51.28; latitude += 0.01) {
      for (let longitude = 5.6; longitude <= 6.03; longitude += 0.01) {
        const point = { latitude, longitude };
        expect(spans.some((span) => distanceInMeters(span, point) <= span.radius)).toBe(true);
      }
    }
  });

  test('A LIVINGLAB WITHOUT AREA HAS NO SPANS', () => {
    expect(getLivingLabSpans(makeLivingLab([]), START, END)).toEqual([]);
  });

  test('POINTS ARE MATCHED AGAINST THE LIVINGLAB POLYGON', () => {
    expect(isInLivingLab({ latitude: 52.087, longitude: 5.17 }, smallLab)).toBe(true);
    expect(isInLivingLab({ latitude: 52.095, longitude: 5.17 }, smallLab)).toBe(false);
    expect(isInLivingLab({ latitude: 52.087, longitude: 5.18 }, smallLab)).toBe(false);
  });

  test('THE SPAN QUERY CONTAINS ALL PARAMETERS WITH AN INTEGER RADIUS', () => {
    const query = new URLSearchParams(
      toSpanQuery({ start: START, end: END, latitude: 52.1, longitude: 5.2, radius: 312.4 })
    );

    expect(query.get('start')).toBe(START);
    expect(query.get('end')).toBe(END);
    expect(query.get('latitude')).toBe('52.1');
    expect(query.get('longitude')).toBe('5.2');
    expect(query.get('radius')).toBe('313');
  });
});
