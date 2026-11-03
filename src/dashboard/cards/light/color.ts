import type { JsonValue } from '@/models/generated/contracts';
import { isJsonObject } from '@/composables/jsonValue';
import { toNumber } from '../../sdk/values';

export type Rgb = { r: number, g: number, b: number };

const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));

/** A color from a report: "#ff8800", "ff8800", "255,136,0" or { r, g, b } (also red/green/blue). */
export function parseColor(value: JsonValue | undefined): Rgb | undefined {
  if (isJsonObject(value)) {
    const r = toNumber(value.r ?? value.red);
    const g = toNumber(value.g ?? value.green);
    const b = toNumber(value.b ?? value.blue);
    return [r, g, b].every(Number.isFinite) ? { r: clamp(r), g: clamp(g), b: clamp(b) } : undefined;
  }
  if (typeof value !== 'string')
    return undefined;
  const text = value.trim();
  const hex = /^#?([0-9a-f]{6})$/i.exec(text)?.[1];
  if (hex)
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
  const parts = text.split(',').map(part => Number(part.trim()));
  return parts.length === 3 && parts.every(Number.isFinite) ? { r: clamp(parts[0]), g: clamp(parts[1]), b: clamp(parts[2]) } : undefined;
}

export function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map(n => clamp(n).toString(16).padStart(2, '0')).join('')}`;
}

/** A color as the color command takes it. */
export function formatColor(rgb: Rgb, format: 'hex' | 'rgb' | 'csv'): JsonValue {
  if (format === 'rgb')
    return { r: rgb.r, g: rgb.g, b: rgb.b };
  if (format === 'csv')
    return `${rgb.r},${rgb.g},${rgb.b}`;
  return toHex(rgb);
}

/** Colors offered as swatches: warm and cool whites first. */
export const swatches = ['#ffb74d', '#fff3e0', '#ffffff', '#e3f2fd', '#ef5350', '#ff7043', '#ffca28', '#66bb6a', '#26c6da', '#42a5f5', '#7e57c2', '#ec407a'];
