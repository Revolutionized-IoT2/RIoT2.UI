// The dashboard model (src/dashboard/sdk/model.ts): ids, upgrading dashboards saved before card kinds,
// what is saved and exported, and importing an export on another system.
import { describe, expect, test } from 'vitest';
import { ComponentSize, ComponentType, ValueType } from '@/models/enums';
import { CardElement } from '@/models/dashboard';
import type { ITemplate } from '@/models/itemplate';
import { cardDefinitions, cardForLegacyType, findCard } from '@/dashboard/sdk/registry';
import { bindTemplate, createCard, exportDashboard, importDashboard, normalizeDashboard, slotOf, toDefinition, withNewIds } from '@/dashboard/sdk/model';
import { cardSpans } from '@/dashboard/sdk/layout';
import type { SettingField } from '@/dashboard/sdk/types';

const template = (id: string, name = id, type = ValueType.Number): ITemplate =>
  ({ id, name, node: 'node', device: 'device', nodeId: 'n', deviceId: 'd', type });

const legacy = (type: ComponentType, properties: Record<string, unknown>, extra: Record<string, unknown> = {}) => normalizeDashboard({
  pages: [{ name: 'Home', components: [{ name: 'card', type, size: ComponentSize.small, elements: [{ id: 'e', name: 'e', properties, reportTemplate: template('r') }], ...extra }] }],
} as never).pages[0].components[0];

describe('card registry', () => {
  test('every card kind is unique and every legacy type has a card', () => {
    const kinds = cardDefinitions().map(definition => definition.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
    for (const type of Object.values(ComponentType).filter(value => typeof value === 'number'))
      expect(cardForLegacyType(type as ComponentType), ComponentType[type as number]).toBeDefined();
  });

  test('every setting a card or element declares has a default', () => {
    const keys = (fields: SettingField[] | undefined) => (fields ?? []).map(field => field.key);
    for (const definition of cardDefinitions()) {
      for (const key of keys(definition.settings))
        expect(definition.defaults, `${definition.kind}.${key}`).toHaveProperty(key);
      const layout = definition.elements;
      const slots = layout == null ? [] : 'each' in layout ? [layout.each] : layout.slots;
      for (const slot of slots)
        for (const key of keys(slot.settings))
          expect(slot.defaults ?? {}, `${definition.kind} element ${key}`).toHaveProperty(key);
    }
  });

  test('a new card has its kind, default settings and the elements it needs', () => {
    const light = createCard(findCard('light')!);
    expect(light.kind).toBe('light');
    expect(light.elements.map(e => e.properties.role)).toEqual(['power']);
    const chart = createCard(findCard('chart')!);
    expect(chart.settings).toMatchObject({ chartType: 'line' });
    expect(chart.elements).toHaveLength(1);
    expect(chart.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('dashboards saved before card kinds', () => {
  test('pages, cards and elements get ids, and existing ids are kept', () => {
    const dashboard = normalizeDashboard({ pages: [{ id: 'p', name: 'a', components: [{ id: 'c', name: 'x', type: 5, size: 3, elements: [{ id: '', name: 'e' }] }] }, { name: 'b' }] } as never);
    expect(dashboard.pages[0].id).toBe('p');
    expect(dashboard.pages[0].components[0].id).toBe('c');
    expect(dashboard.pages[0].components[0].elements[0].id).not.toBe('');
    expect(dashboard.pages[1].id).not.toBe('');
    expect(dashboard.pages[0].components[0].elements[0]).toBeInstanceOf(CardElement);
  });

  test('a numeric value becomes a sensor reading its "{member}"', () => {
    const card = legacy(ComponentType.numericValue, { value: '{temperature}', unit: '{unit}', digits: 1, useTrendIcon: true });
    expect(card.kind).toBe('sensor');
    expect(card.elements[0].properties).toEqual({ member: 'temperature', unit: '{unit}', digits: 1 });
    expect(card.settings).toMatchObject({ showTrend: true });
  });

  test('charts keep their chart type, labels and colors', () => {
    const card = legacy(ComponentType.chart_doughnut, { value: '{kwh}', label: '{hour}', color: '{color}' });
    expect(card.kind).toBe('chart');
    expect(card.settings).toMatchObject({ chartType: 'doughnut' });
    expect(card.elements[0].properties).toMatchObject({ member: 'kwh', labelMember: 'hour', colorMember: 'color', color: '' });
    expect(toDefinition(normalizeDashboard({ pages: [{ name: 'p', components: [card] }] } as never)).pages![0].components![0].type).toBe(ComponentType.chart_doughnut);
  });

  test('slide buttons are buttons in a scrolling row', () => {
    const card = legacy(ComponentType.slideButton, { onValue: 'on', offValue: 'off' });
    expect(card.kind).toBe('buttons');
    expect(card.settings).toMatchObject({ layout: 'row' });
    expect(card.elements[0].properties).toMatchObject({ onValue: 'on', offValue: 'off' });
  });

  test('switch positions become flat settings with MDI icons', () => {
    const card = legacy(ComponentType.switch, { on: { icon: 'lightbulb', color: 'green', name: 'Lit' }, off: { icon: 'error', color: 'red', name: 'Dark' } });
    expect(card.elements[0].properties).toEqual({ onLabel: 'Lit', onIcon: 'mdi-lightbulb', onColor: 'green', offLabel: 'Dark', offIcon: 'mdi-alert-circle' });
  });

  test('a state card with one state forgets it after 12 minutes, as before', () => {
    const card = legacy(ComponentType.state, { states: [{ value: 1, icon: 'home', color: 'red', name: 'Home' }] });
    expect(card.elements[0].properties).toMatchObject({ expireMinutes: 12, states: [{ icon: 'mdi-home' }] });
  });

  test('Material icon names become MDI; unknown ones stay for the Material font', () => {
    const dashboard = normalizeDashboard({ pages: [{ name: 'p', icon: 'home', components: [{ name: 'c', icon: 'some_unknown_icon', type: 5, size: 3, elements: [] }] }] } as never);
    expect(dashboard.pages[0].icon).toBe('mdi-home');
    expect(dashboard.pages[0].components[0].icon).toBe('some_unknown_icon');
  });
});

describe('saving and exporting', () => {
  const dashboard = () => {
    const d = normalizeDashboard({ id: 'dash', pages: [{ id: 'p', name: 'Home', components: [] }] });
    const card = createCard(findCard('sensor')!);
    card.elements[0].reportTemplate = { ...template('temp', 'Temperature'), maintainHistory: true } as never;
    card.elements[0].report = { id: 'temp', value: 21, timeStamp: 1 };
    d.pages[0].components.push(card);
    return d;
  };

  test('the definition has template references and no reports', () => {
    const definition = toDefinition(dashboard());
    const element = definition.pages![0].components![0].elements![0] as unknown as Record<string, unknown>;
    expect(element.reportTemplate).toEqual({ id: 'temp', name: 'Temperature', node: 'node', device: 'device' });
    expect(element).not.toHaveProperty('report');
    expect(element).not.toHaveProperty('previousReports');
    expect(definition.pages![0].components![0]).toMatchObject({ kind: 'sensor', type: ComponentType.numericValue });
  });

  test('an export imports elsewhere, with templates bound by id, else by node, device and name', () => {
    const text = exportDashboard(dashboard(), new Date('2026-11-03T12:00:00Z'));
    expect(JSON.parse(text)).toMatchObject({ format: 'riot2-dashboard', version: 1, exportedAt: '2026-11-03T12:00:00.000Z' });

    const other = { ...template('other-id', 'Temperature') };
    const result = importDashboard(text, { reports: [other], commands: [] });
    expect(result).toMatchObject({ pages: 1, cards: 1, unresolved: [] });
    expect(result.dashboard.pages[0].components[0].elements[0].reportTemplate?.id).toBe('other-id');

    const missing = importDashboard(text, { reports: [], commands: [] });
    expect(missing.unresolved).toEqual(['node / device / Temperature']);
    expect(missing.dashboard.pages[0].components[0].elements[0].reportTemplate).toBeUndefined();
  });

  test('an invalid file says what is wrong', () => {
    expect(() => importDashboard('{', { reports: [], commands: [] })).toThrow('not JSON');
    expect(() => importDashboard('{"name":"x"}', { reports: [], commands: [] })).toThrow('no pages');
  });

  test('appended pages get new ids for everything', () => {
    const d = dashboard();
    const [copy] = withNewIds(d.pages);
    expect(copy.id).not.toBe(d.pages[0].id);
    expect(copy.components[0].id).not.toBe(d.pages[0].components[0].id);
    expect(copy.components[0].elements[0].id).not.toBe(d.pages[0].components[0].elements[0].id);
  });
});

test('small compact cards sit two side by side on phones; others take the full width', () => {
  expect(cardSpans(ComponentSize.small, true)).toEqual({ xs: 6, sm: 6, md: 4, lg: 3 });
  expect(cardSpans(ComponentSize.small, false).xs).toBe(12);
  expect(cardSpans(ComponentSize.half)).toEqual({ xs: 12, sm: 12, md: 6, lg: 6 });
  expect(cardSpans(ComponentSize.full).lg).toBe(12);
});

test('binding a template picks the member that suits the card, and drops one the new report lacks', () => {
  const definition = findCard('sensor')!;
  const card = createCard(definition);
  const element = card.elements[0];
  const slot = slotOf(definition, element, 0);
  bindTemplate(element, 'report', { ...template('climate', 'Climate', ValueType.Entity), model: { name: 'x', temperature: 21.5 } }, slot);
  expect(element.properties.member).toBe('temperature');
  expect(element.name).toBe('Climate');
  expect(element.icon).toBe('mdi-thermometer');

  bindTemplate(element, 'report', template('plain', 'Plain', ValueType.Number), slot);
  expect(element.properties.member).toBe('');
});
