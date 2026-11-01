import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { Variable } from '@/models/variable';

/** Variables: list, save and delete. */
export function useVariableApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  function getVariables(): Promise<Variable[] | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetVariables;
    return httpClient.get<Variable[]>(url);
  }

  function saveVariable(variable: Variable): Promise<null> {
    const url = orchestratorStore.baseUrl + Constants.urlSaveVariable;
    return httpClient.post<Variable, null>(url, variable);
  }

  function deleteVariable(id: string): Promise<null> {
    const url = orchestratorStore.baseUrl + Constants.urlDeleteVariable.replace('{id}', encodeURIComponent(id));
    return httpClient.delete<null>(url);
  }

  return {
    getVariables,
    saveVariable,
    deleteVariable
  };
}
