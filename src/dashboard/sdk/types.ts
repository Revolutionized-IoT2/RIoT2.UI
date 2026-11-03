import type { Component } from 'vue';
import type { ComponentSize, ComponentType } from '@/models/enums';
import type { DashboardCard } from '@/models/dashboard';
import type { JsonObject, JsonValue } from '@/models/generated/contracts';
import type { SchemaType, ValueSchema } from '@/models/valueSchema';

/** Settings as stored: a card's `settings` or an element's `properties`. */
export type Settings = JsonObject;

export type CardCategory = 'sensors' | 'controls' | 'charts' | 'media' | 'other';

/** The props every card component gets. */
export interface CardProps {
  card: DashboardCard;
  /** True in the card gallery and the editor's preview: controls send no commands. */
  preview?: boolean;
}

/** What a settings field knows besides the settings. */
export interface FieldContext {
  /** The element's report value schema, declared or inferred. */
  reportSchema?: ValueSchema;
  /** The element's command value schema, declared or inferred. */
  commandSchema?: ValueSchema;
  /** The schema of the element's chosen member (`member` setting), else the report schema. */
  valueSchema?: ValueSchema;
  /** The card's settings, for element fields. */
  card?: Settings;
}

interface FieldBase<K extends string> {
  key: K;
  label: string;
  hint?: string;
  /** Shown only when this returns true. */
  visible?: (settings: Settings, context: FieldContext) => boolean;
}

export type SelectOption = { value: string | number | boolean, title: string, icon?: string };

/** One input of a settings form. The editor builds forms from these (SettingsForm.vue). */
export type SettingField<K extends string = string> =
  | FieldBase<K> & { type: 'text', placeholder?: string }
  | FieldBase<K> & { type: 'textarea' | 'markdown', rows?: number }
  | FieldBase<K> & { type: 'number', min?: number, max?: number, step?: number, suffix?: string }
  | FieldBase<K> & { type: 'boolean' }
  | FieldBase<K> & { type: 'select', options: SelectOption[] }
  | FieldBase<K> & { type: 'icon' }
  | FieldBase<K> & { type: 'color' }
  /** A unit; the element's schema suggests one. */
  | FieldBase<K> & { type: 'unit' }
  /** A member of the element's entity report, such as "temperature" or "sensor.temperature". */
  | FieldBase<K> & { type: 'member', accepts?: SchemaType[] }
  /** A command (or report) value of the element, edited as its schema describes. */
  | FieldBase<K> & { type: 'value', source: 'command' | 'report' }
  /** A list of objects, each edited with `fields`: a state card's states. */
  | FieldBase<K> & { type: 'list', fields: SettingField[], itemTitle?: (item: Settings, index: number) => string, newItem: () => Settings };

export type Requirement = 'required' | 'optional' | 'none';

/** What one element of a card binds: a report to show, a command to send, and its own settings. */
export interface ElementSlot<E extends Settings = Settings> {
  /** Names a fixed slot (`slots` layout), such as "power" or "brightness"; stored in the element's properties. */
  role?: string;
  label: string;
  hint?: string;
  report: Requirement;
  command: Requirement;
  /** The value types that suit the slot; the template picker lists those templates first. */
  accepts?: SchemaType[];
  /** How many past reports the element keeps (when its template keeps a history). */
  history?: number;
  defaults?: E;
  settings?: SettingField<Extract<keyof E, string>>[];
}

/** Elements as a list of alike items (`each`), or as fixed, named slots. */
export type ElementLayout<E extends Settings = Settings> =
  | { each: ElementSlot<E>, min: number, max: number }
  | { slots: ElementSlot<E>[] };

/** Sample data for the card gallery: each element's report values, newest last. */
export interface CardSample {
  name: string;
  icon?: string;
  settings?: Settings;
  elements: { name: string, icon?: string, properties?: Settings, values: JsonValue[], schema?: ValueSchema, command?: boolean }[];
}

/**
 * A card type. Each folder in src/dashboard/cards exports one from its index.ts with `defineCard`,
 * and the registry finds it there. See src/dashboard/README.md.
 */
export interface CardDefinition<S extends Settings = Settings, E extends Settings = Settings> {
  /** Stored in the card's `kind`; never change it once released. */
  kind: string;
  title: string;
  description: string;
  icon: string;
  category: CardCategory;
  /** The type older readers see; may depend on the settings (a chart's chart type). */
  legacyType: ComponentType | ((settings: S) => ComponentType);
  /** The legacy types this card shows, for dashboards saved before card kinds (Core 2.2.0). */
  replaces?: ComponentType[];
  defaultSize: ComponentSize;
  /** A small card of this kind takes half the width on phones: two side by side. */
  compact?: boolean;
  defaults: S;
  settings?: SettingField<Extract<keyof S, string>>[];
  elements?: ElementLayout<E>;
  /** How well the card suits a value, from 0 (not at all) to 1. Suggests cards for a template. */
  suits?: (schema: ValueSchema) => number;
  /** Turns a card saved before card kinds (one of `replaces`) into this kind's settings. */
  upgrade?: (card: DashboardCard) => void;
  sample?: CardSample;
  component: Component;
}

/** Declares a card type, with its settings types checked against its fields. */
export function defineCard<S extends Settings, E extends Settings = Settings>(definition: CardDefinition<S, E>): CardDefinition<S, E> {
  return definition;
}

export type AnyCardDefinition = CardDefinition<Settings, Settings>;
export type { JsonValue };
