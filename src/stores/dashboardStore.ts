import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useDashboardApi } from '@/composables/api/dashboardApi';
import { useRequests } from './requests';
import type Dashboard from '@/models/dashboard';
import type { DashboardCard, DashboardPage } from '@/models/dashboard';
import type { IReport } from '@/models/report';
import { cloneCard, newId, normalizeDashboard, toDefinition, withNewIds } from '@/dashboard/sdk/model';

const snapshot = (dashboard: Dashboard | null) => JSON.stringify(toDefinition(dashboard));

/**
 * The dashboard: its pages and cards, kept current by the reports the UI receives. The editor
 * changes it here; `dirty` says whether it differs from what was loaded or saved.
 */
export const useDashboardStore = defineStore('dashboard', () => {
  const api = useDashboardApi();
  const { loading, error, run } = useRequests();

  const dashboard = ref<Dashboard | null>(null);
  const saved = ref(snapshot(null));

  // Reads only the definition (not reports), so a report doesn't recompute it.
  const dirty = computed(() => dashboard.value != null && snapshot(dashboard.value) !== saved.value);

  async function load(): Promise<void> {
    const loaded = await run(() => api.getDashboard());
    if (loaded === undefined)
      return;
    dashboard.value = normalizeDashboard(loaded);
    saved.value = snapshot(dashboard.value);
  }

  /** Saves the dashboard, then reloads it (with each element's history). Resolves to success. */
  async function save(): Promise<boolean> {
    if (dashboard.value == null)
      return false;
    const definition = toDefinition(dashboard.value);
    const id = await run(() => api.saveDashboard(definition));
    if (id == null)
      return false;
    saved.value = JSON.stringify(definition);
    await load();
    return true;
  }

  /** Drops the unsaved changes. */
  function discard(): Promise<void> {
    return load();
  }

  /** A report template's kept reports, newest first, for the editor's preview. */
  async function reportHistory(templateId: string): Promise<IReport[]> {
    return await run(() => api.getReportHistory(templateId)) ?? [];
  }

  /** Shows a report on every element bound to its template. */
  function applyReport(report: IReport): void {
    for (const page of dashboard.value?.pages ?? [])
      for (const card of page.components)
        for (const element of card.elements)
          if (element.reportTemplate?.id == report.id)
            element.report = report;
  }

  function pages(): DashboardPage[] {
    return dashboard.value?.pages ?? [];
  }

  function addPage(name: string, icon?: string | null): DashboardPage {
    const page: DashboardPage = { id: newId(), name, icon: icon ?? null, components: [] };
    dashboard.value ??= normalizeDashboard(null);
    dashboard.value.pages.push(page);
    return page;
  }

  function updatePage(id: string, changes: Pick<DashboardPage, 'name' | 'icon'>): void {
    const page = pages().find(p => p.id === id);
    if (page != null)
      Object.assign(page, changes);
  }

  /** Removes a page; the last page stays. */
  function removePage(id: string): void {
    const index = pages().findIndex(p => p.id === id);
    if (index !== -1 && pages().length > 1)
      pages().splice(index, 1);
  }

  function movePage(id: string, offset: number): void {
    const list = pages();
    const from = list.findIndex(p => p.id === id);
    const to = from + offset;
    if (from === -1 || to < 0 || to >= list.length)
      return;
    list.splice(to, 0, ...list.splice(from, 1));
  }

  function locate(cardId: string): { page: DashboardPage, index: number } | undefined {
    for (const page of pages()) {
      const index = page.components.findIndex(card => card.id === cardId);
      if (index !== -1)
        return { page, index };
    }
    return undefined;
  }

  /** Adds a card to a page, or replaces the card with its id (what the card editor saves). */
  function putCard(pageId: string, card: DashboardCard): void {
    const found = locate(card.id);
    if (found != null) {
      found.page.components.splice(found.index, 1, card);
      return;
    }
    pages().find(p => p.id === pageId)?.components.push(card);
  }

  function removeCard(cardId: string): void {
    const found = locate(cardId);
    found?.page.components.splice(found.index, 1);
  }

  /** Puts a copy of the card, with new ids, right after it. */
  function duplicateCard(cardId: string): DashboardCard | undefined {
    const found = locate(cardId);
    if (found == null)
      return undefined;
    const copy = cloneCard(found.page.components[found.index]);
    copy.id = newId();
    copy.elements.forEach(element => { element.id = newId(); });
    found.page.components.splice(found.index + 1, 0, copy);
    return copy;
  }

  function moveCardToPage(cardId: string, pageId: string): void {
    const found = locate(cardId);
    const target = pages().find(p => p.id === pageId);
    if (found == null || target == null || target === found.page)
      return;
    const [card] = found.page.components.splice(found.index, 1);
    target.components.push(card);
  }

  /** Replaces the dashboard with an imported one, or adds its pages; unsaved until saved. */
  function importDashboard(imported: Dashboard, mode: 'replace' | 'append'): void {
    if (mode === 'replace' || dashboard.value == null) {
      imported.id = dashboard.value?.id || imported.id;
      dashboard.value = imported;
      return;
    }
    dashboard.value.pages.push(...withNewIds(imported.pages));
  }

  return {
    dashboard, dirty, loading, error,
    load, save, discard, applyReport, reportHistory,
    addPage, updatePage, removePage, movePage,
    putCard, removeCard, duplicateCard, moveCardToPage, importDashboard,
  };
});
