import type { JsonValue } from '@/models/generated/contracts';
import { isJsonObject } from '@/composables/jsonValue';

/** One point of a forecast series (Core 2.3.0 `ForecastSeries`), with its times as dates. */
export interface ForecastPointView {
  start: Date;
  end: Date;
  value: number | null;
}

export interface ForecastView {
  issuedAt?: Date;
  kind: string;
  unit: string;
  points: ForecastPointView[];
}

export type ForecastRange = 'all' | 'today' | 'tomorrow' | 'next24';

/** A forecast series from a report value, or undefined when the value isn't one. */
export function readForecast(value: JsonValue | undefined): ForecastView | undefined {
  if (!isJsonObject(value) || !Array.isArray(value.points) || value.issuedAt == null)
    return undefined;
  const points: ForecastPointView[] = [];
  for (const point of value.points) {
    if (!isJsonObject(point))
      continue;
    const start = new Date(String(point.start));
    const end = new Date(String(point.end));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
      continue;
    points.push({ start, end, value: typeof point.value === 'number' ? point.value : null });
  }
  const issued = new Date(String(value.issuedAt));
  return {
    issuedAt: Number.isNaN(issued.getTime()) ? undefined : issued,
    kind: typeof value.kind === 'string' ? value.kind : 'forecast',
    unit: typeof value.unit === 'string' ? value.unit : '',
    points: points.sort((a, b) => a.start.getTime() - b.start.getTime()),
  };
}

function midnight(now: Date, days: number): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
}

/** The points of a range: the local day today or tomorrow, the next 24 hours, or all. */
export function pointsIn(points: ForecastPointView[], range: ForecastRange, now = new Date()): ForecastPointView[] {
  let from: Date;
  let to: Date;
  switch (range) {
    case 'today': from = midnight(now, 0); to = midnight(now, 1); break;
    case 'tomorrow': from = midnight(now, 1); to = midnight(now, 2); break;
    case 'next24': from = now; to = new Date(now.getTime() + 24 * 3600 * 1000); break;
    default: return points;
  }
  return points.filter(point => point.end > from && point.start < to);
}

/** The point that applies now, if any. */
export function currentPoint(points: ForecastPointView[], now = new Date()): ForecastPointView | undefined {
  return points.find(point => point.start <= now && now < point.end);
}

/** The lowest and highest values, ignoring points without one. */
export function extremes(points: ForecastPointView[]): { min?: number, max?: number } {
  const values = points.map(point => point.value).filter((value): value is number => value != null);
  return values.length === 0 ? {} : { min: Math.min(...values), max: Math.max(...values) };
}
