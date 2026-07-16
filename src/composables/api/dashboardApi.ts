import { Constants } from '@/models/constants';
import { ComponentElement } from '@/models/componentElement';
import { useHttpClient, withCallback } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import Dashboard from '@/models/dashboard';

export function useDashboardApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  async function fetchDashboard(): Promise<Dashboard | null> {

    let dashboardUrl = orchestratorStore.baseUrl + Constants.urlGetDashboardConfigurationWithHistory;
    let dashboard = await httpClient.get<Dashboard>(dashboardUrl);

    if(dashboard == null || dashboard.pages == null)
      dashboard = new Dashboard();

    //ComponentElements must be initialized in order then to work properly
    for(let page of dashboard.pages) {
      for(let component of page.components) {
        let initializedElems: ComponentElement[] = [];
        for(let elem of component.elements) { 
          initializedElems.push(new ComponentElement(elem));
        }
        component.elements = initializedElems;
      }
    }

    return dashboard;
  }

  function getDashboard(callback:(dashboard: Dashboard | null) => void, completed?:()=> void): Promise<void> {
    return withCallback(fetchDashboard(), callback, completed);
  }

  function saveDashboard(dashboard: Dashboard, callback:(data: string | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlSaveDashboard;
    return withCallback(httpClient.post<Dashboard, string | null>(url, dashboard), callback, completed);
  }

  return {
    getDashboard,
    saveDashboard
  };
}
