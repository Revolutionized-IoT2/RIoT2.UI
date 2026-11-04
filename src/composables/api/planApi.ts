import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { CommandPlan, ForecastInfo } from '@/models/commandPlan';

/** Forecasts and command plans (ADR 0019). */
export function usePlanApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();
  const url = (route: string) => orchestratorStore.baseUrl + route;

  function getForecasts(): Promise<ForecastInfo[] | null> {
    const address = url(Constants.urlForecasts);
    return httpClient.get<ForecastInfo[]>(address);
  }

  function getPlans(active: boolean, limit = 100): Promise<CommandPlan[] | null> {
    const address = url(Constants.urlCommandPlans);
    return httpClient.get<CommandPlan[]>(address, { params: { active, limit } });
  }

  function cancelPlan(id: string): Promise<CommandPlan | null> {
    const address = url(Constants.urlCommandPlan.replace('{id}', encodeURIComponent(id)));
    return httpClient.delete<CommandPlan>(address);
  }

  return { getForecasts, getPlans, cancelPlan };
}
