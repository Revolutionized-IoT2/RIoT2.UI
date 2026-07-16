import { Constants } from '@/models/constants';
import { useHttpClient, withCallback } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { Variable } from '@/models/rules/variable';
import type VariableTemplate from '@/models/variableTemplate';

export function useVariableApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  function getVariables(callback:(data: Variable[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetVariables;
    return withCallback(httpClient.get<Variable[] | null>(url), callback, completed);
  }

  function saveVariable(variable: Variable, callback:(data: void | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlSaveVariable;
    return withCallback(httpClient.post<Variable, void | null>(url, variable), callback, completed);
  }

  function deleteVariable(id: string, callback:(data: void | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlDeleteVariable;
    url = url.replace('{id}', id);
    return withCallback(httpClient.get<void>(url), callback, completed);
  }

  function getVariableTemplates(callback:(data: VariableTemplate[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetVariableTemplates;
    return withCallback(httpClient.get<VariableTemplate[] | null>(url), callback, completed);
  }

  return {
    getVariables,
    saveVariable,
    deleteVariable,
    getVariableTemplates
  };
}
