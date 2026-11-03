// The dashboard store: reports reach the bound elements, unsaved changes are noticed (but reports
// are not changes), and the editor's operations keep ids unique and stable.
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ComponentSize } from '@/models/enums';

const api = vi.hoisted(() => ({
  getDashboard: vi.fn(),
  saveDashboard: vi.fn(),
  getReportHistory: vi.fn(),
}));
vi.mock('@/composables/api/dashboardApi', () => ({ useDashboardApi: () => api }));

const { useDashboardStore } = await import('@/stores/dashboardStore');
const { createCard } = await import('@/dashboard/sdk/model');
const { findCard } = await import('@/dashboard/sdk/registry');

const element = (id: string) => ({ id: `e-${id}`, name: id, reportTemplate: { id }, properties: {} });
const stored = () => ({
  id: 'dash',
  pages: [{ id: 'p1', name: 'One', components: [
    { id: 'c1', name: 'a', kind: 'sensor', type: 5, size: 3, elements: [element('t'), element('u')] },
    { id: 'c2', name: 'b', kind: 'sensor', type: 5, size: 3, elements: [element('t')] },
  ] }, { id: 'p2', name: 'Two', components: [] }],
});

beforeEach(() => {
  setActivePinia(createPinia());
  api.getDashboard.mockReset().mockImplementation(async () => stored());
  api.saveDashboard.mockReset().mockResolvedValue('dash');
});

test('a report reaches every element bound to its template, and is not an unsaved change', async () => {
  const store = useDashboardStore();
  await store.load();
  store.applyReport({ id: 't', value: 2, timeStamp: 2 });
  const elements = store.dashboard!.pages[0].components.flatMap(c => c.elements);
  expect(elements.map(e => e.report?.value)).toEqual([2, undefined, 2]);
  expect(store.dirty).toBe(false);
});

describe('editing', () => {
  test('changes are unsaved until saved; saving sends the definition and reloads', async () => {
    const store = useDashboardStore();
    await store.load();
    store.dashboard!.pages[0].components[0].size = ComponentSize.full;
    expect(store.dirty).toBe(true);
    expect(await store.save()).toBe(true);
    const sent = api.saveDashboard.mock.calls[0][0];
    expect(sent.pages[0].components[0]).toMatchObject({ id: 'c1', size: ComponentSize.full, kind: 'sensor' });
    expect(sent.pages[0].components[0].elements[0]).not.toHaveProperty('previousReports');
    expect(api.getDashboard).toHaveBeenCalledTimes(2);
  });

  test('discarding reloads what was saved', async () => {
    const store = useDashboardStore();
    await store.load();
    store.removeCard('c1');
    expect(store.dirty).toBe(true);
    await store.discard();
    expect(store.dirty).toBe(false);
    expect(store.dashboard!.pages[0].components.map(c => c.id)).toEqual(['c1', 'c2']);
  });

  test('pages: add, rename, move and remove; the last page stays', async () => {
    const store = useDashboardStore();
    await store.load();
    const page = store.addPage('Three', 'mdi-sofa');
    store.updatePage(page.id, { name: 'Living', icon: 'mdi-sofa' });
    store.movePage(page.id, -1);
    expect(store.dashboard!.pages.map(p => p.name)).toEqual(['One', 'Living', 'Two']);
    for (const p of store.dashboard!.pages.slice())
      store.removePage(p.id);
    expect(store.dashboard!.pages).toHaveLength(1);
  });

  test('cards: add, replace by id, duplicate with new ids, move to another page', async () => {
    const store = useDashboardStore();
    await store.load();
    const card = createCard(findCard('gauge')!);
    store.putCard('p1', card);
    store.putCard('p1', { ...card, name: 'edited' });
    const cards = store.dashboard!.pages[0].components;
    expect(cards.map(c => c.name)).toEqual(['a', 'b', 'edited']);

    const copy = store.duplicateCard('c1')!;
    expect(cards.map(c => c.id).slice(0, 2)).toEqual(['c1', copy.id]);
    expect(copy.elements[0].id).not.toBe(cards[0].elements[0].id);

    store.moveCardToPage('c2', 'p2');
    expect(store.dashboard!.pages[1].components.map(c => c.id)).toEqual(['c2']);
    const ids = store.dashboard!.pages.flatMap(p => p.components.map(c => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('an import replaces the dashboard, keeping its id, or adds its pages', async () => {
    const store = useDashboardStore();
    await store.load();
    const { normalizeDashboard } = await import('@/dashboard/sdk/model');
    store.importDashboard(normalizeDashboard({ id: 'other', pages: [{ name: 'Imported', components: [] }] }), 'append');
    expect(store.dashboard!.pages.map(p => p.name)).toEqual(['One', 'Two', 'Imported']);
    store.importDashboard(normalizeDashboard({ id: 'other', pages: [{ name: 'Only', components: [] }] }), 'replace');
    expect(store.dashboard!.id).toBe('dash');
    expect(store.dashboard!.pages.map(p => p.name)).toEqual(['Only']);
  });
});
