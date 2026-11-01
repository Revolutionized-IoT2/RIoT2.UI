import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { ReportTemplate } from '@/models/reportTemplate';
import type CommandTemplate from '@/models/commandTemplate';
import type VariableTemplate from '@/models/variableTemplate';

/** The report, command and variable templates of every node. */
export function useTemplateApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  function getReportTemplates(): Promise<ReportTemplate[] | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetReportTemplates;
    return httpClient.get<ReportTemplate[]>(url);
  }

  function getCommandTemplates(): Promise<CommandTemplate[] | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetCommandTemplates;
    return httpClient.get<CommandTemplate[]>(url);
  }

  function getVariableTemplates(): Promise<VariableTemplate[] | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetVariableTemplates;
    return httpClient.get<VariableTemplate[]>(url);
  }

  return {
    getReportTemplates,
    getCommandTemplates,
    getVariableTemplates
  };
}
