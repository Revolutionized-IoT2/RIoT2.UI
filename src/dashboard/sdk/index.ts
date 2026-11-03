/**
 * The dashboard card kit: what a card type uses. See src/dashboard/README.md.
 */
export { defineCard } from './types';
export type { CardDefinition, CardProps, CardCategory, ElementSlot, SettingField, Settings, CardSample } from './types';
export { useCardSettings, useElement, useElements, useCommand, type ElementView } from './composables';
export { readElement, isOn, switchValue, commandIsBoolean, type ElementReading, type HistoryPoint } from './reading';
export { formatNumber, toBoolean, toNumber, toText, memberValue, sameValue, trend, reportTime } from './values';
export { iconFor, normalizeIcon } from './icons';
export { templateSchema, schemaAt, isNumeric, guessSemantic, unitFor } from './capabilities';
export { useColors, resolveColor, colorChoices } from './colors';
