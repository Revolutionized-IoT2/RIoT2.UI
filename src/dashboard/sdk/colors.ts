import { computed } from 'vue';
import { useTheme } from 'vuetify';
import * as palette from 'vuetify/util/colors';

/** The colors a color setting offers: theme roles first, then the Material palette. */
export const colorChoices = [
  'primary', 'secondary', 'tertiary', 'success', 'warning', 'error', 'info',
  'red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'light-blue', 'cyan', 'teal', 'green',
  'light-green', 'lime', 'yellow', 'amber', 'orange', 'deep-orange', 'brown', 'blue-grey', 'grey',
];

type Palette = Record<string, Record<string, string>>;

const camel = (name: string) => name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

/**
 * A color setting as a CSS color for canvases and SVG: a theme color ("primary"), a Material palette
 * color as Vuetify names it ("deep-purple-accent-4", "red"), or any CSS color ("#ff8800").
 */
export function resolveColor(name: string | null | undefined, themeColors: Record<string, string>, fallback = themeColors.primary): string {
  const color = name?.trim();
  if (!color)
    return fallback;
  if (themeColors[color])
    return themeColors[color];
  const match = /^([a-z-]+?)(?:-(lighten|darken|accent)-(\d))?$/.exec(color);
  if (match) {
    const hues = (palette as unknown as Palette)[camel(match[1])];
    const shade = match[2] ? `${match[2]}${match[3]}` : 'base';
    if (hues?.[shade])
      return hues[shade];
  }
  return color;
}

/** resolveColor with the current theme's colors. */
export function useColors() {
  const theme = useTheme();
  const colors = computed(() => theme.current.value.colors as Record<string, string>);
  return {
    colors,
    resolve: (name: string | null | undefined, fallback?: string) => resolveColor(name, colors.value, fallback ?? colors.value.primary),
  };
}

/** A color with transparency, for canvases (which don't all read color-mix): "#3366cc" -> "#3366cc80". */
export function withAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (hex == null)
    return color;
  const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
  return `#${full}${Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, '0')}`;
}