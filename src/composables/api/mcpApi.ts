import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { McpActivityEntry, McpConfiguration, McpConfigurationSave, McpStatus } from '@/models/mcp';

/** The MCP server's status, tool policy and activity (ADR 0018). */
export function useMcpApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();
  const url = (route: string) => orchestratorStore.baseUrl + route;

  function getStatus(): Promise<McpStatus | null> {
    const address = url(Constants.urlMcpStatus);
    return httpClient.get<McpStatus>(address);
  }

  function getConfiguration(): Promise<McpConfiguration | null> {
    const address = url(Constants.urlMcpConfiguration);
    return httpClient.get<McpConfiguration>(address);
  }

  function saveConfiguration(configuration: McpConfigurationSave): Promise<McpConfiguration | null> {
    const address = url(Constants.urlMcpConfiguration);
    return httpClient.put<McpConfigurationSave, McpConfiguration>(address, configuration);
  }

  function getActivity(max: number): Promise<McpActivityEntry[] | null> {
    const address = url(Constants.urlMcpActivity);
    return httpClient.get<McpActivityEntry[]>(address, { params: { max } });
  }

  return { getStatus, getConfiguration, saveConfiguration, getActivity };
}
