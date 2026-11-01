import { Constants } from '@/models/constants';
import { ComponentElement } from '@/models/componentElement';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import Dashboard from '@/models/dashboard';

/** The dashboard definition, with each element's report history. */
export function useDashboardApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  /** Resolves to an empty dashboard when none is saved yet. */
  async function getDashboard(): Promise<Dashboard> {
    const url = orchestratorStore.baseUrl + Constants.urlGetDashboardConfigurationWithHistory;
    let dashboard = await httpClient.get<Dashboard>(url);

    if (dashboard == null || dashboard.pages == null)
      dashboard = new Dashboard();

    // ComponentElements must be constructed to work.
    for (const page of dashboard.pages)
      for (const component of page.components)
        component.elements = component.elements.map(element => new ComponentElement(element));

    return dashboard;
  }

  /** Resolves to the saved dashboard's id. */
  function saveDashboard(dashboard: Dashboard): Promise<string | null> {
    const url = orchestratorStore.baseUrl + Constants.urlSaveDashboard;
    return httpClient.post<Dashboard, string>(url, dashboard);
  }

  return {
    getDashboard,
    saveDashboard
  };
}
