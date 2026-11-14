// The card catalog the UI uploads for the MCP dashboard tools (I60): every card kind travels, in the shape the
// orchestrator accepts, and the upload happens only when the stored catalog is older or different.
import { describe, expect, test, vi } from 'vitest';
import { buildCardCatalog, compareVersions, hashCards, uiVersion } from '@/dashboard/sdk/catalog';
import { cardDefinitions } from '@/dashboard/sdk/registry';
import { syncCardCatalog } from '@/composables/cardCatalog';

// What DashboardCardCatalogService.Validate accepts (RIoT2.Net.Orchestrator/Services/Dashboard).
const fieldTypes = ['text', 'textarea', 'markdown', 'number', 'boolean', 'select', 'icon', 'color', 'unit', 'member', 'value', 'list'];
const requirements = ['required', 'optional', 'none'];

describe('buildCardCatalog', () => {
  const catalog = buildCardCatalog();

  test('has every card kind once, in the shape the orchestrator accepts', () => {
    expect(catalog).toMatchObject({ format: 'riot2-card-catalog', version: 1, uiVersion });
    expect(catalog.cards.map(c => c.kind).sort()).toEqual(cardDefinitions().map(d => d.kind).sort());
    for (const card of catalog.cards) {
      expect(card.kind).toMatch(/^[A-Za-z0-9_-]{1,50}$/);
      expect([3, 6, 9, 12]).toContain(card.defaultSize);
      const fields = [...card.settings, ...(card.elements?.slots ?? []).flatMap(s => s.settings ?? []), ...(card.elements?.each?.settings ?? [])];
      for (const field of fields.flatMap(f => [f, ...(f.fields ?? [])]))
        expect(fieldTypes, `${card.kind}.${field.key}`).toContain(field.type);
      for (const slot of [...(card.elements?.slots ?? []), ...(card.elements?.each ? [card.elements.each] : [])]) {
        expect(requirements).toContain(slot.report);
        expect(requirements).toContain(slot.command);
      }
      for (const slot of card.elements?.slots ?? [])
        expect(slot.role, card.kind).toBeTruthy();
    }
  });

  test('is plain JSON: no functions, and it survives a round trip', () => {
    expect(JSON.parse(JSON.stringify(catalog))).toEqual(catalog);
    const light = catalog.cards.find(c => c.kind === 'light')!;
    expect(light.elements?.slots?.map(s => s.role)).toEqual(['power', 'brightness', 'color']);
    expect(light.elements?.slots?.[0].settings?.find(f => f.key === 'member')).toMatchObject({ type: 'member', conditional: true });
  });

  test('a legacy type that depends on a setting is listed per value', () => {
    const chart = catalog.cards.find(c => c.kind === 'chart')!;
    expect(chart.legacyTypeBy?.key).toBe('chartType');
    expect(new Set(Object.values(chart.legacyTypeBy!.values)).size).toBeGreaterThan(1);
    expect(catalog.cards.find(c => c.kind === 'gauge')!.legacyTypeBy).toBeUndefined();
  });

  test('the hash follows the cards', () => {
    expect(hashCards(catalog.cards)).toBe(catalog.hash);
    const changed = structuredClone(catalog.cards);
    changed[0].title += '!';
    expect(hashCards(changed)).not.toBe(catalog.hash);
  });
});

test('versions compare by their numbers', () => {
  expect(compareVersions('1.14.0', '1.13.9')).toBeGreaterThan(0);
  expect(compareVersions('1.14.0-dev', '1.14.0')).toBe(0);
  expect(compareVersions('1.9.0', '1.10.0')).toBeLessThan(0);
});

describe('syncCardCatalog', () => {
  const catalog = buildCardCatalog(undefined, '1.14.0');
  const api = (stored: unknown) => ({
    getCardCatalog: vi.fn().mockResolvedValue(stored),
    saveCardCatalog: vi.fn().mockResolvedValue(stored),
  }) as unknown as Parameters<typeof syncCardCatalog>[0] & { saveCardCatalog: ReturnType<typeof vi.fn> };

  test('uploads when there is none, or it differs', async () => {
    for (const stored of [null, { uiVersion: '1.14.0', hash: 'other' }, { uiVersion: '1.13.0', hash: catalog.hash }]) {
      const client = api(stored);
      expect(await syncCardCatalog(client, catalog)).toBe('uploaded');
      expect(client.saveCardCatalog).toHaveBeenCalledWith(catalog);
    }
  });

  test('keeps the same or a newer UI\'s catalog', async () => {
    const same = api({ uiVersion: '1.14.0', hash: catalog.hash });
    expect(await syncCardCatalog(same, catalog)).toBe('current');
    const newer = api({ uiVersion: '1.15.0', hash: 'x' });
    expect(await syncCardCatalog(newer, catalog)).toBe('older');
    expect(same.saveCardCatalog).not.toHaveBeenCalled();
    expect(newer.saveCardCatalog).not.toHaveBeenCalled();
  });

  test('an orchestrator without the route is no error', async () => {
    const client = api(null);
    client.saveCardCatalog.mockRejectedValue(new Error('404'));
    expect(await syncCardCatalog(client, catalog)).toBe('failed');
  });
});
