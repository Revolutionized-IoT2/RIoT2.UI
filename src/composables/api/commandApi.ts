import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type Command from '@/models/command';
import type { Report } from '@/models/report';
import type { CommandDelivery, OutboxSummary } from '@/models/commandDelivery';

/** Device commands with their delivery status, the outbox, and the latest report and command states. */
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

  /** Queues the command (POST /api/v2/commands, without waiting) and resolves to its delivery. */
  function sendCommand(command: Command): Promise<CommandDelivery | null> {
    const url = orchestratorStore.baseUrl + Constants.urlCommands;
    return httpClient.post<Command, CommandDelivery>(url, command);
  }

  function getDelivery(correlationId: string): Promise<CommandDelivery | null> {
    const url = orchestratorStore.baseUrl + Constants.urlCommandDelivery.replace('{id}', encodeURIComponent(correlationId));
    return httpClient.get<CommandDelivery>(url);
  }

  function getOutboxSummary(): Promise<OutboxSummary | null> {
    return httpClient.get<OutboxSummary>(orchestratorStore.baseUrl + Constants.urlOutboxSummary);
  }

  return {
    getReportState,
    getCommandState,
    sendCommand,
    getDelivery,
    getOutboxSummary
  };
}
