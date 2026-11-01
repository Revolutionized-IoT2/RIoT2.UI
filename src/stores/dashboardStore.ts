import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useDashboardApi } from '@/composables/api/dashboardApi';
import { useRequests } from './requests';
import type Dashboard from '@/models/dashboard';
import type { IReport } from '@/models/report';

/** The dashboard definition, kept current by the reports the UI receives. */
export const useDashboardStore = defineStore('dashboard', () => {
  const api = useDashboardApi();
  const { loading, error, run } = useRequests();

  const dashboard = ref<Dashboard | null>(null);

  async function load(): Promise<void> {
    const loaded = await run(() => api.getDashboard());
    if (loaded !== undefined)
      dashboard.value = loaded;
  }

  /** Saves the dashboard, then reloads it. Resolves to success. */
  async function save(): Promise<boolean> {
    if (dashboard.value == null)
      return false;
    const id = await run(() => api.saveDashboard(dashboard.value!));
    if (id == null)
      return false;
    await load();
    return true;
  }

  /** Shows a report on every element bound to its template. */
  function applyReport(report: IReport): void {
    for (const page of dashboard.value?.pages ?? [])
      for (const component of page.components)
        for (const element of component.elements)
          if (element.reportTemplate?.id == report.id)
            element.report = report;
  }

  return { dashboard, loading, error, load, save, applyReport };
});
