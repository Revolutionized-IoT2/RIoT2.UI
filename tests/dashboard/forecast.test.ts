// The forecast card's reading of a forecast series (Core 2.3.0 ForecastSeries).
import { expect, test } from 'vitest';
import { currentPoint, extremes, pointsIn, readForecast } from '@/dashboard/cards/forecast/forecast';

const series = {
  issuedAt: '2026-11-04T12:00:00+00:00',
  kind: 'confirmed',
  unit: 'c/kWh',
  points: [
    { start: '2026-11-04T23:00:00+00:00', end: '2026-11-05T00:00:00+00:00', value: 3 },
    { start: '2026-11-04T22:00:00+00:00', end: '2026-11-04T23:00:00+00:00', value: 5 },
    { start: '2026-11-05T00:00:00+00:00', end: '2026-11-05T01:00:00+00:00', value: null },
    { start: 'never', end: '2026-11-05T01:00:00+00:00', value: 1 },
  ],
};

test('a series is read in time order without unreadable points', () => {
  const forecast = readForecast(series)!;
  expect(forecast.kind).toBe('confirmed');
  expect(forecast.unit).toBe('c/kWh');
  expect(forecast.points.map(point => point.value)).toEqual([5, 3, null]);
  expect(readForecast(21)).toBeUndefined();
  expect(readForecast({ points: [] })).toBeUndefined();
});

test('ranges, the point now and the extremes', () => {
  const points = readForecast(series)!.points;
  const now = new Date('2026-11-04T23:30:00Z');
  expect(currentPoint(points, now)?.value).toBe(3);
  expect(pointsIn(points, 'next24', now).map(point => point.value)).toEqual([3, null]);
  expect(pointsIn(points, 'all', now)).toHaveLength(3);
  expect(extremes(points)).toEqual({ min: 3, max: 5 });
  expect(extremes([])).toEqual({});
});
