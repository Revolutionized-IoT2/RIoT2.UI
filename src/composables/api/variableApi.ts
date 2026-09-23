import { Constants } from '@/models/constants';
import { useHttpClient, withCallback } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { Variable } from '@/models/variable';
import type VariableTemplate from '@/models/variableTemplate';
import type Command from '@/models/command';

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

  async function setVariableValue(command: Command, callback:(data: void | null) => void, completed?:()=> void): Promise<void> {
    const url = orchestratorStore.baseUrl + Constants.urlGetVariableValue.replace('{id}', encodeURIComponent(command.id));
    const variable = await httpClient.get<Variable>(url);
    if (variable == null) {
      callback(null);
      completed?.();
      return;
    }

    // The save endpoint requires the full DTO; retain its current metadata.
    return saveVariable({ ...variable, value: command.value }, callback, completed);
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
    setVariableValue,
    deleteVariable,
    getVariableTemplates
  };
}
