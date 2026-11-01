import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type Command from '@/models/command';
import type { Report } from '@/models/report';

/** Device commands and the latest report and command states. */
export function useCommandApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  function getReportState(id: string): Promise<Report | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetReportOrCommandState
      .replace('{id}', encodeURIComponent(id))
      .replace('{type}', "report");
    return httpClient.get<Report>(url);
  }

  function getCommandState(id: string): Promise<Command | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetReportOrCommandState
      .replace('{id}', encodeURIComponent(id))
      .replace('{type}', "command");
    return httpClient.get<Command>(url);
  }

  /** Resolves once the orchestrator has queued the command. */
  function executeCommand(command: Command): Promise<null> {
    const url = orchestratorStore.baseUrl + Constants.urlExecuteCommand;
    return httpClient.post<Command, null>(url, command);
  }

  return {
    getReportState,
    getCommandState,
    executeCommand
  };
}
