import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { Variable } from '@/models/rules/variable';
import type VariableTemplate from '@/models/variableTemplate';

export function useVariableApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  async function getVariables(callback:(data: Variable[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetVariables;
    let data = await httpClient.get<Variable[] | null>(url);
    callback(data);
    completed?.();
  }

  async function saveVariable(variable: Variable, callback:(data: void | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlSaveVariable;
    let data = await httpClient.post<Variable, void | null>(url, variable);
    callback(data);
    completed?.();
  }

  async function deleteVariable(id: string, callback:(data: void | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlDeleteVariable;
    url = url.replace('{id}', id);
    let data = await httpClient.get<void>(url);
    callback(data);
    completed?.();
  }

  async function getVariableTemplates(callback:(data: VariableTemplate[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetVariableTemplates;
    let data = await httpClient.get<VariableTemplate[] | null>(url);
    callback(data);
    completed?.();
  }

  return {
    getVariables,
    saveVariable,
    deleteVariable,
    getVariableTemplates
  };
}
