import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { LlmConnection, LlmConnectionSave, LlmRunResult, LlmUsageSummary } from '@/models/workflow';

/** Language model connections for the Run LLM step, and their usage (ADR 0016). */
export function useLlmApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();
  const url = (route: string, id?: string) => orchestratorStore.baseUrl + (id == null ? route : route.replace('{id}', encodeURIComponent(id)));

  function getConnections(): Promise<LlmConnection[] | null> {
    const address = url(Constants.urlLlmConnections);
    return httpClient.get<LlmConnection[]>(address);
  }

  function createConnection(connection: LlmConnectionSave): Promise<LlmConnection | null> {
    const address = url(Constants.urlLlmConnections);
    return httpClient.post<LlmConnectionSave, LlmConnection>(address, connection);
  }

  function updateConnection(id: string, connection: LlmConnectionSave): Promise<LlmConnection | null> {
    const address = url(Constants.urlLlmConnection, id);
    return httpClient.put<LlmConnectionSave, LlmConnection>(address, connection);
  }

  function deleteConnection(id: string): Promise<null> {
    const address = url(Constants.urlLlmConnection, id);
    return httpClient.delete<null>(address);
  }

  /** Asks the connection's model for a one-word answer. */
  function testConnection(id: string): Promise<LlmRunResult | null> {
    const address = url(Constants.urlTestLlmConnection, id);
    return httpClient.post<null, LlmRunResult>(address, null);
  }

  function getUsage(days: number, connection: string | null): Promise<LlmUsageSummary | null> {
    const address = url(Constants.urlLlmUsage);
    return httpClient.get<LlmUsageSummary>(address, { params: { days, connection: connection ?? undefined } });
  }

  return { getConnections, createConnection, updateConnection, deleteConnection, testConnection, getUsage };
}
