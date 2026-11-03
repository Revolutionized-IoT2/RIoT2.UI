import type { JsonValue } from '@/models/generated/contracts';
import { isJsonObject, valueAt } from '@/composables/jsonValue';

/** Splits a member path: "sensor.temperature" -> ["sensor", "temperature"]; "" -> []. */
export function memberPath(member: JsonValue | undefined): string[] {
  return typeof member === 'string' && member.trim() !== '' ? member.trim().split('.') : [];
}

/** The member of a report value, or the value itself when no member is chosen. */
export function memberValue(value: JsonValue | undefined, member: JsonValue | undefined): JsonValue | undefined {
  const path = memberPath(member);
  return path.length === 0 ? value : valueAt(value, path);
}

/** A number, or NaN when the value isn't one ("21.5" is). */
export function toNumber(value: JsonValue | undefined): number {
  if (typeof value === 'number')
    return value;
  if (typeof value === 'boolean')
    return value ? 1 : 0;
  if (typeof value === 'string' && value.trim() !== '')
    return Number(value);
  return Number.NaN;
}

const trueWords = new Set(['true', 'on', '1', 'yes', 'open', 'opened', 'detected', 'active', 'motion', 'occupied']);
const falseWords = new Set(['false', 'off', '0', 'no', 'closed', 'close', 'clear', 'inactive', 'idle', 'none', '']);

/** True or false, or undefined when the value says neither ("on" is true, "clear" is false). */
export function toBoolean(value: JsonValue | undefined): boolean | undefined {
  if (typeof value === 'boolean')
    return value;
  if (typeof value === 'number')
    return Number.isNaN(value) ? undefined : value > 0;
  if (typeof value === 'string') {
    const word = value.trim().toLowerCase();
    if (trueWords.has(word))
      return true;
    if (falseWords.has(word))
      return false;
  }
  return undefined;
}

export function toText(value: JsonValue | undefined): string {
  if (value == null)
    return '';
  if (typeof value === 'object')
    return JSON.stringify(value);
  return String(value);
}

/**
 * A setting that may read the report: a string "{member}" is that member of the current report value
 * ("{unit}" in a sensor's unit shows the report's unit member). Other values are returned as they are.
 */
export function resolveSetting(setting: JsonValue | undefined, reportValue: JsonValue | undefined): JsonValue | undefined {
  if (typeof setting === 'string' && setting.length > 2 && setting.startsWith('{') && setting.endsWith('}'))
    return memberValue(reportValue, setting.slice(1, -1));
  return setting;
}

/** Formats a number with a fixed number of decimals (0 to 6), in the browser's locale. */
export function formatNumber(value: number, digits?: number | null, locale?: string): string {
  if (!Number.isFinite(value))
    return '–';
  const fraction = digits == null || !Number.isFinite(digits) ? undefined : Math.min(6, Math.max(0, Math.trunc(digits)));
  return new Intl.NumberFormat(locale, fraction === undefined
    ? { maximumFractionDigits: 2 }
    : { minimumFractionDigits: fraction, maximumFractionDigits: fraction }).format(value);
}

/** A report's time stamp (seconds since the epoch) as a Date. */
export function reportTime(timeStamp: number | undefined | null): Date | undefined {
  return timeStamp == null || !Number.isFinite(timeStamp) ? undefined : new Date(timeStamp * 1000);
}

/** Whether two JSON values are equal, objects member by member. */
export function sameValue(a: JsonValue | undefined, b: JsonValue | undefined): boolean {
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((item, i) => sameValue(item, b[i]));
  if (isJsonObject(a) && isJsonObject(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(key => sameValue(a[key], b[key]));
  }
  return Object.is(a, b);
}

/**
 * Where the values are heading: a least-squares line through them, compared with the latest value.
 * Needs four values; "flat" within 2 % of the value range.
 */
export function trend(values: number[]): 'up' | 'down' | 'flat' | undefined {
  const points = values.filter(Number.isFinite);
  if (points.length < 4)
    return undefined;
  const n = points.length;
  const meanX = (n - 1) / 2;
  const meanY = points.reduce((sum, y) => sum + y, 0) / n;
  let numerator = 0;
  let denominator = 0;
  points.forEach((y, x) => {
    numerator += (x - meanX) * (y - meanY);
    denominator += (x - meanX) ** 2;
  });
  const slope = numerator / denominator;
  const range = Math.max(...points) - Math.min(...points);
  const change = slope * (n - 1);
  if (range === 0 || Math.abs(change) < range * 0.02)
    return 'flat';
  return change > 0 ? 'up' : 'down';
}
