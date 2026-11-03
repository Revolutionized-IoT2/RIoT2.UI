import { ComponentType } from '@/models/enums';
import type { AnyCardDefinition, CardCategory, Settings } from './types';

// Every card type: the default export of each src/dashboard/cards/<kind>/index.ts. Their Vue
// components load when a dashboard first shows one (defineAsyncComponent in each index.ts).
const modules = import.meta.glob('../cards/*/index.ts', { eager: true, import: 'default' });

const categoryOrder: CardCategory[] = ['sensors', 'controls', 'charts', 'media', 'other'];

export const categoryTitles: Record<CardCategory, string> = {
  sensors: 'Sensors', controls: 'Controls', charts: 'Charts', media: 'Media', other: 'Other',
};

const definitions: AnyCardDefinition[] = (Object.values(modules) as AnyCardDefinition[])
  .sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) || a.title.localeCompare(b.title));

const byKind = new Map(definitions.map(definition => [definition.kind, definition]));
if (byKind.size !== definitions.length)
  throw new Error('Two dashboard cards have the same kind.');

/** Every card type, by category and title. */
export function cardDefinitions(): readonly AnyCardDefinition[] {
  return definitions;
}

export function findCard(kind: string | null | undefined): AnyCardDefinition | undefined {
  return kind == null ? undefined : byKind.get(kind);
}

/** The card that shows a legacy type, for dashboards saved before card kinds. */
export function cardForLegacyType(type: ComponentType): AnyCardDefinition | undefined {
  return definitions.find(definition => definition.replaces?.includes(type));
}

/** The type older readers see for a card of this kind. */
export function legacyTypeOf(definition: AnyCardDefinition, settings: Settings): ComponentType {
  return typeof definition.legacyType === 'function' ? definition.legacyType(settings) : definition.legacyType;
}
