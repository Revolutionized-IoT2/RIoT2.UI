import { v4 as uuid } from 'uuid';
import Dashboard, { CardElement, type CardElementData, type DashboardCard, type DashboardPage, type TemplateRef } from '@/models/dashboard';
import { ComponentSize, ComponentType } from '@/models/enums';
import type { JsonObject } from '@/models/generated/contracts';
import type { ITemplate } from '@/models/itemplate';
import { isJsonObject } from '@/composables/jsonValue';
import { cardForLegacyType, findCard, legacyTypeOf } from './registry';
import { normalizeIcon, iconFor } from './icons';
import { defaultMember, memberOptions, templateSchema } from './capabilities';
import type { AnyCardDefinition, ElementSlot, Settings } from './types';

export function newId(): string {
  return uuid();
}

const clone = <T>(value: T): T => value == null ? value : JSON.parse(JSON.stringify(value));

/** The slot an element fills: the list's item, or the fixed slot named by its `role`. */
export function slotOf(definition: AnyCardDefinition | undefined, element: CardElement | undefined, index: number): ElementSlot | undefined {
  const layout = definition?.elements;
  if (layout == null)
    return undefined;
  if ('each' in layout)
    return layout.each;
  const role = element?.properties?.role;
  return layout.slots.find(slot => slot.role === role) ?? layout.slots[index];
}

/** A card's settings over its kind's defaults. */
export function cardSettings<S extends Settings>(card: DashboardCard, definition: { defaults: S } | undefined): S {
  return { ...(definition?.defaults ?? {}), ...(card.settings ?? {}) } as S;
}

/** An element's settings (properties) over its slot's defaults. */
export function elementSettings<E extends Settings>(element: CardElement | undefined, slot: ElementSlot | undefined): E {
  return { ...(slot?.defaults ?? {}), ...(element?.properties ?? {}) } as E;
}

/** The element in a fixed slot (`role`), if the card has one bound. */
export function elementByRole(card: DashboardCard, role: string): CardElement | undefined {
  return card.elements.find(element => element.properties?.role === role);
}

export type DashboardData = { id?: string | null, name?: string | null, pages?: PageData[] | null };
type PageData = { id?: string | null, name?: string | null, icon?: string | null, components?: CardData[] | null };
type CardData = Partial<Omit<DashboardCard, 'elements'>> & { elements?: (CardElementData | CardElement)[] | null };

/**
 * A dashboard as the UI handles it, from what the orchestrator or an import file has: every page,
 * card and element has an id, elements are CardElements, and cards saved before card kinds get the
 * kind that shows their legacy type, with their settings upgraded.
 */
export function normalizeDashboard(data: DashboardData | null | undefined): Dashboard {
  const dashboard = new Dashboard();
  dashboard.id = data?.id ?? '';
  dashboard.name = data?.name ?? '';
  dashboard.pages = (data?.pages ?? []).map(normalizePage);
  return dashboard;
}

export function normalizePage(page: PageData): DashboardPage {
  return {
    id: page.id || newId(),
    name: page.name ?? 'Page',
    icon: normalizeIcon(page.icon) ?? null,
    components: (page.components ?? []).map(normalizeCard),
  };
}

export function normalizeCard(data: CardData): DashboardCard {
  const card: DashboardCard = {
    id: data.id || newId(),
    name: data.name ?? '',
    description: data.description ?? '',
    icon: normalizeIcon(data.icon) ?? null,
    type: data.type ?? ComponentType.numericValue,
    size: data.size ?? ComponentSize.small,
    kind: data.kind ?? null,
    settings: isJsonObject(data.settings ?? undefined) ? data.settings! : {},
    elements: (data.elements ?? []).map(element => element instanceof CardElement ? element : new CardElement({
      ...element,
      id: element.id || newId(),
      name: element.name ?? '',
      icon: normalizeIcon(element.icon) ?? null,
    })),
  };
  let definition = findCard(card.kind);
  if (definition == null && !card.kind) {
    definition = cardForLegacyType(card.type);
    if (definition != null) {
      card.kind = definition.kind;
      definition.upgrade?.(card);
    }
  }
  const layout = definition?.elements;
  if (layout != null && 'slots' in layout)
    card.elements.forEach((element, index) => { element.properties.role ??= layout.slots[index]?.role ?? null; });
  return card;
}

export function templateRef(template: ITemplate | TemplateRef | null | undefined): TemplateRef | null {
  if (template == null || !template.id)
    return null;
  return { id: template.id, name: template.name, node: template.node, device: template.device };
}

/**
 * The dashboard's definition, without reports: what is saved and exported, and what is compared to
 * find unsaved changes. Templates are references; `type` is the legacy type of each card's kind.
 */
export function toDefinition(dashboard: Dashboard | null | undefined): DashboardData {
  return {
    id: dashboard?.id ?? '',
    name: dashboard?.name ?? '',
    pages: (dashboard?.pages ?? []).map(page => ({
      id: page.id,
      name: page.name,
      icon: page.icon ?? null,
      components: page.components.map(cardDefinitionData),
    })),
  };
}

function cardDefinitionData(card: DashboardCard): CardData {
  const definition = findCard(card.kind);
  return {
    id: card.id,
    name: card.name,
    description: card.description ?? '',
    icon: card.icon ?? null,
    type: definition ? legacyTypeOf(definition, cardSettings(card, definition)) : card.type,
    size: card.size,
    kind: card.kind ?? null,
    settings: clone(card.settings ?? {}),
    elements: card.elements.map(element => ({
      id: element.id,
      name: element.name,
      icon: element.icon ?? null,
      numberOfPreviousReports: element.numberOfPreviousReports,
      properties: clone(element.properties ?? {}),
      reportTemplate: templateRef(element.reportTemplate),
      commandTemplate: templateRef(element.commandTemplate),
    })),
  };
}

/** A fresh copy of a card for the editor; its elements keep their reports, so the preview shows data. */
export function cloneCard(card: DashboardCard): DashboardCard {
  return {
    ...clone({ ...card, elements: [] }),
    elements: card.elements.map(element => new CardElement({
      id: element.id,
      name: element.name,
      icon: element.icon,
      reportTemplate: element.reportTemplate,
      commandTemplate: element.commandTemplate,
      numberOfPreviousReports: element.numberOfPreviousReports,
      properties: clone(element.properties),
      previousReports: element.previousReports.slice(),
      report: element.report,
    })),
  };
}

/** A card of a kind, with its default settings and the elements its fixed slots or minimum ask for. */
export function createCard(definition: AnyCardDefinition): DashboardCard {
  const settings = clone(definition.defaults);
  const layout = definition.elements;
  const elements = layout == null ? [] : 'each' in layout
    ? Array.from({ length: Math.max(1, layout.min) }, () => createElement(layout.each))
    : layout.slots.filter(slot => slot.report === 'required' || slot.command === 'required').map(slot => createElement(slot));
  return {
    id: newId(),
    name: '',
    description: '',
    icon: null,
    type: legacyTypeOf(definition, settings),
    size: definition.defaultSize,
    kind: definition.kind,
    settings,
    elements,
  };
}

export function createElement(slot: ElementSlot | undefined): CardElement {
  const properties: JsonObject = clone(slot?.defaults ?? {});
  if (slot?.role)
    properties.role = slot.role;
  return new CardElement({ id: newId(), name: '', properties, numberOfPreviousReports: slot?.history ?? 1 });
}

/**
 * Binds a template to an element and fills in what the template tells: the element's name and icon
 * when empty, the member of an entity report that suits the slot, and the history the slot keeps.
 */
export function bindTemplate(element: CardElement, use: 'report' | 'command', template: ITemplate | null | undefined, slot: ElementSlot | undefined): void {
  if (use === 'report')
    element.reportTemplate = (template ?? undefined) as CardElement['reportTemplate'];
  else
    element.commandTemplate = (template ?? undefined) as CardElement['commandTemplate'];
  const schema = templateSchema(template);
  // A member the new report doesn't have would hide its value (and its field may be hidden too).
  const member = element.properties.member;
  if (use === 'report' && typeof member === 'string' && member !== '' && !memberOptions(schema).some(option => option.path === member))
    element.properties.member = '';
  if (template == null)
    return;
  if (!element.name)
    element.name = template.name;
  if (!element.icon)
    element.icon = iconFor(schema?.semantic) ?? undefined;
  if (use === 'report') {
    const keepsHistory = (template as { maintainHistory?: boolean }).maintainHistory === true;
    element.numberOfPreviousReports = keepsHistory ? Math.max(1, slot?.history ?? 1) : 1;
    const suggested = defaultMember(schema, slot?.accepts);
    const hasMemberField = slot?.settings?.some(field => field.type === 'member');
    if (hasMemberField && suggested && !element.properties.member) {
      element.properties.member = suggested;
      if (!element.icon)
        element.icon = iconFor(schema?.properties?.[suggested]?.semantic) ?? undefined;
    }
  }
}

export const exportFormat = 'riot2-dashboard';

/** The export file (Dashboard > Export): the definition, with template names to bind them again elsewhere. */
export function exportDashboard(dashboard: Dashboard, exportedAt = new Date()): string {
  return JSON.stringify({ format: exportFormat, version: 1, exportedAt: exportedAt.toISOString(), dashboard: toDefinition(dashboard) }, null, 2);
}

export type ImportResult = { dashboard: Dashboard, pages: number, cards: number, unresolved: string[] };

/**
 * Reads an export file (or a stored DashboardConfiguration) and binds its templates to this
 * system's: by id, else by node, device and name. Templates found in neither way are left unbound
 * and listed in `unresolved`. Throws an Error that says what is wrong with an invalid file.
 */
export function importDashboard(text: string, templates: { reports: ITemplate[], commands: ITemplate[] }): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The file is not JSON.');
  }
  const wrapper = parsed as { format?: string, dashboard?: DashboardData, pages?: unknown };
  const data = wrapper?.format === exportFormat ? wrapper.dashboard : wrapper as DashboardData;
  if (data == null || typeof data !== 'object' || !Array.isArray(data.pages))
    throw new Error('The file is not a RIoT2 dashboard: it has no pages.');
  for (const page of data.pages)
    if (page == null || typeof page !== 'object' || (page.components != null && !Array.isArray(page.components)))
      throw new Error('The file is not a RIoT2 dashboard: a page is not valid.');

  const unresolved = new Set<string>();
  const resolve = (reference: TemplateRef | null | undefined, list: ITemplate[]) => {
    if (reference == null || !reference.id)
      return null;
    const found = list.find(t => t.id === reference.id)
      ?? list.find(t => t.name === reference.name && t.device === reference.device && t.node === reference.node);
    if (found == null)
      unresolved.add([reference.node, reference.device, reference.name ?? reference.id].filter(Boolean).join(' / '));
    return found ?? null;
  };
  for (const page of data.pages)
    for (const card of page.components ?? [])
      for (const element of card.elements ?? []) {
        element.reportTemplate = resolve(element.reportTemplate as TemplateRef, templates.reports) as CardElementData['reportTemplate'];
        element.commandTemplate = resolve(element.commandTemplate as TemplateRef, templates.commands) as CardElementData['commandTemplate'];
        element.previousReports = [];
      }
  const dashboard = normalizeDashboard(data);
  return {
    dashboard,
    pages: dashboard.pages.length,
    cards: dashboard.pages.reduce((count, page) => count + page.components.length, 0),
    unresolved: [...unresolved],
  };
}

/** Pages with new ids for themselves, their cards and elements, to add next to existing ones. */
export function withNewIds(pages: DashboardPage[]): DashboardPage[] {
  return pages.map(page => ({
    ...page,
    id: newId(),
    components: page.components.map(card => {
      const copy = cloneCard(card);
      copy.id = newId();
      copy.elements.forEach(element => { element.id = newId(); });
      return copy;
    }),
  }));
}
