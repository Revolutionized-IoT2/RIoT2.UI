import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type SystemNode from '@/models/systemNode';
import type NodeConfiguration from '@/models/nodeConfiguration';
import type DeviceConfiguration from '@/models/deviceConfiguration';
import type DeviceStatus from '@/models/deviceStatus';
import type { PluginFile } from '@/models/pluginFile';
import type { CronValidationResult } from '@/models/cronValidationResult';
import type { NodeSync } from '@/models/nodeSync';

/** Node configurations, online nodes and the checks the node editor runs. */
export function useNodeApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  function getNodes(): Promise<SystemNode[] | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetNodes;
    return httpClient.get<SystemNode[]>(url);
  }

  function getOnlineNodes(): Promise<SystemNode[] | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetNodesOnline;
    return httpClient.get<SystemNode[]>(url);
  }

  function getNodeConfiguration(id: string): Promise<NodeConfiguration | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetNodeConfiguration.replace('{id}', encodeURIComponent(id));
    return httpClient.get<NodeConfiguration>(url);
  }

  /** Resolves to the saved node's id. */
  function saveNodeConfiguration(configuration: NodeConfiguration): Promise<string | null> {
    const url = orchestratorStore.baseUrl + Constants.urlSaveNodeConfiguration;
    return httpClient.post<NodeConfiguration, string>(url, configuration);
  }

  function deleteNode(id: string): Promise<null> {
    const url = orchestratorStore.baseUrl + Constants.urlDeleteNodeById.replace('{id}', encodeURIComponent(id));
    return httpClient.delete<null>(url);
  }

  function getNodeDevicesStatus(id: string): Promise<DeviceStatus[] | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetNodeDevicesStatus.replace('{id}', encodeURIComponent(id));
    return httpClient.get<DeviceStatus[]>(url);
  }

  /** The device templates an online node offers; null when it is offline or offers none. */
  function getDeviceTemplates(id: string): Promise<DeviceConfiguration[] | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetNodeDeviceTemplates.replace('{id}', encodeURIComponent(id));
    return httpClient.get<DeviceConfiguration[]>(url);
  }

  function checkPlugin(plugin: PluginFile): Promise<PluginFile | null> {
    const url = orchestratorStore.baseUrl + Constants.urlCheckPlugin;
    return httpClient.post<PluginFile, PluginFile>(url, plugin);
  }

  /** Every node's configuration sync, without the device states (cheap enough to poll). */
  function getSync(): Promise<NodeSync[] | null> {
    return httpClient.get<NodeSync[]>(orchestratorStore.baseUrl + Constants.urlNodesSync);
  }

  /** Sends the node its configuration command again; rejects with 409 when the node is offline. */
  function applyConfiguration(id: string): Promise<null> {
    const url = orchestratorStore.baseUrl + Constants.urlApplyNodeConfiguration.replace('{id}', encodeURIComponent(id));
    return httpClient.post<null, null>(url, null);
  }

  function validateCron(cron: CronValidationResult): Promise<CronValidationResult | null> {
    const url = orchestratorStore.baseUrl + Constants.urlValidateCron;
    return httpClient.post<CronValidationResult, CronValidationResult>(url, cron);
  }

  return {
    getNodes,
    getOnlineNodes,
    getNodeConfiguration,
    saveNodeConfiguration,
    deleteNode,
    getNodeDevicesStatus,
    getDeviceTemplates,
    checkPlugin,
    validateCron,
    getSync,
    applyConfiguration
  };
}
