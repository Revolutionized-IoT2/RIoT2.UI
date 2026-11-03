import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { DashboardData } from '@/dashboard/sdk/model';
import type { IReport } from '@/models/report';

/** The dashboard definition, with each element's report history. */
export function useDashboardApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  /** Resolves to null when none is saved yet. */
  function getDashboard(): Promise<DashboardData | null> {
    return httpClient.get<DashboardData>(orchestratorStore.baseUrl + Constants.urlGetDashboardConfigurationWithHistory);
  }

  /** Saves the definition (toDefinition in src/dashboard/sdk/model.ts); resolves to the dashboard's id. */
  function saveDashboard(definition: DashboardData): Promise<string | null> {
    return httpClient.post<DashboardData, string>(orchestratorStore.baseUrl + Constants.urlSaveDashboard, definition);
  }

  /** A report template's kept reports, newest first; just the latest when it keeps no history. */
  function getReportHistory(templateId: string): Promise<IReport[] | null> {
    return httpClient.get<IReport[]>(orchestratorStore.baseUrl + Constants.urlGetReportHistory.replace('{id}', encodeURIComponent(templateId)));
  }

  return {
    getDashboard,
    saveDashboard,
    getReportHistory
  };
}
