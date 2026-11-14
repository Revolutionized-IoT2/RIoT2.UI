import type { JsonObject, JsonValue } from '@/models/generated/contracts';
import { cardDefinitions } from './registry';
import type { AnyCardDefinition, ElementSlot, SettingField, Settings } from './types';

/**
 * The card catalog the UI uploads to the orchestrator (PUT /api/v2/dashboard/cards, I60): every card kind with its
 * settings, defaults and element slots, so the MCP dashboard tools can build and check cards. Functions (`visible`,
 * `suits`, `upgrade`) can't travel: a field with a `visible` condition is marked `conditional`, and a legacy type that
 * depends on a setting is listed per value of that setting (`legacyTypeBy`).
 */
export interface CardCatalog {
  format: 'riot2-card-catalog';
  version: 1;
  uiVersion: string;
  hash: string;
  cards: CatalogCard[];
}

export interface CatalogCard {
  kind: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  defaultSize: number;
  compact: boolean;
  legacyType: number;
  legacyTypeBy?: { key: string, values: Record<string, number> };
  defaults: JsonObject;
  settings: CatalogField[];
  elements?: { each?: CatalogSlot, min?: number, max?: number, slots?: CatalogSlot[] };
  sample?: JsonObject;
}

export interface CatalogField {
  key: string;
  type: string;
  label: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: JsonValue, title: string }[];
  fields?: CatalogField[];
  accepts?: string[];
  source?: string;
  conditional?: boolean;
}

export interface CatalogSlot {
  role?: string;
  label: string;
  hint?: string;
  report: string;
  command: string;
  accepts?: string[];
  history?: number;
  defaults?: JsonObject;
  settings?: CatalogField[];
}

/** The UI's version (package.json), which the orchestrator compares to keep the newest UI's catalog. */
export const uiVersion: string = typeof __UI_VERSION__ === 'string' ? __UI_VERSION__ : '0.0.0';

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value ?? null));

function field(source: SettingField): CatalogField {
  const result: CatalogField = { key: source.key, type: source.type, label: source.label };
  if (source.hint)
    result.hint = source.hint;
  if (source.visible)
    result.conditional = true;
  switch (source.type) {
    case 'number':
      if (source.min != null) result.min = source.min;
      if (source.max != null) result.max = source.max;
      if (source.step != null) result.step = source.step;
      break;
    case 'select':
      result.options = source.options.map(option => ({ value: option.value, title: option.title }));
      break;
    case 'member':
      if (source.accepts) result.accepts = [...source.accepts];
      break;
    case 'value':
      result.source = source.source;
      break;
    case 'list':
      result.fields = source.fields.map(field);
      break;
  }
  return result;
}

function slot(source: ElementSlot): CatalogSlot {
  const result: CatalogSlot = { label: source.label, report: source.report, command: source.command };
  if (source.role) result.role = source.role;
  if (source.hint) result.hint = source.hint;
  if (source.accepts) result.accepts = [...source.accepts];
  if (source.history != null) result.history = source.history;
  if (source.defaults) result.defaults = json(source.defaults as JsonObject);
  if (source.settings) result.settings = source.settings.map(field);
  return result;
}

/** For a legacy type that depends on the settings: the select setting it depends on, and the type for each value. */
function legacyTypeBy(definition: AnyCardDefinition): CatalogCard['legacyTypeBy'] {
  const legacyType = definition.legacyType;
  if (typeof legacyType !== 'function')
    return undefined;
  for (const setting of definition.settings ?? []) {
    if (setting.type !== 'select')
      continue;
    const values: Record<string, number> = {};
    for (const option of setting.options)
      if (typeof option.value === 'string')
        values[option.value] = legacyType({ ...definition.defaults, [setting.key]: option.value } as Settings);
    if (new Set(Object.values(values)).size > 1)
      return { key: setting.key, values };
  }
  return undefined;
}

export function catalogCard(definition: AnyCardDefinition): CatalogCard {
  const legacyType = typeof definition.legacyType === 'function' ? definition.legacyType(definition.defaults) : definition.legacyType;
  const card: CatalogCard = {
    kind: definition.kind,
    title: definition.title,
    description: definition.description,
    category: definition.category,
    icon: definition.icon,
    defaultSize: definition.defaultSize,
    compact: definition.compact === true,
    legacyType,
    defaults: json(definition.defaults as JsonObject),
    settings: (definition.settings ?? []).map(field),
  };
  const by = legacyTypeBy(definition);
  if (by)
    card.legacyTypeBy = by;
  const layout = definition.elements;
  if (layout != null)
    card.elements = 'each' in layout ? { each: slot(layout.each), min: layout.min, max: layout.max } : { slots: layout.slots.map(slot) };
  if (definition.sample)
    card.sample = json(definition.sample as unknown as JsonObject);
  return card;
}

/** A short, stable hash of the cards (cyrb53): the UI uploads again when the stored catalog's differs. */
export function hashCards(cards: CatalogCard[]): string {
  const text = JSON.stringify(cards);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export function buildCardCatalog(definitions: readonly AnyCardDefinition[] = cardDefinitions(), version = uiVersion): CardCatalog {
  const cards = definitions.map(catalogCard);
  return { format: 'riot2-card-catalog', version: 1, uiVersion: version, hash: hashCards(cards), cards };
}

/** Compares versions by their numbers (1.14.0-dev is 1.14.0). */
export function compareVersions(a: string, b: string): number {
  const parts = (text: string) => text.split(/[-+]/)[0].replace(/^v/, '').split('.').map(x => Number.parseInt(x, 10) || 0);
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++)
    if ((x[i] ?? 0) !== (y[i] ?? 0))
      return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
}
