import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type SystemNode from '@/models/systemNode';
import NodeConfiguration from '@/models/nodeConfiguration';
import DeviceConfiguration from '@/models/deviceConfiguration';
import type DeviceStatus from '@/models/deviceStatus';
import type { PluginFile } from '@/models/rules/pluginFile';

export function useNodeApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  async function getNodes(callback:(data: SystemNode[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetNodes;
    let data = await httpClient.get<SystemNode[]>(url);
    callback(data);
    completed?.();
  }

  async function getOnlineNodes(callback:(data: SystemNode[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetNodesOnline;
    let data = await httpClient.get<SystemNode[]>(url);
    callback(data);
    completed?.();
  }

  async function getNodeConfiguration(id: string, callback:(data: NodeConfiguration | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetNodeConfiguration;
    url = url.replace('{id}', id)

    let data = await httpClient.get<NodeConfiguration>(url);
    callback(data);
    completed?.();
  }

  async function saveNodeConfiguration(configuration: Object, callback:(data:string | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlSaveNodeConfiguration;
    let data = await httpClient.post<Object, string | null>(url, configuration);
    callback(data);
    completed?.();
  }

  async function deleteNode(id: string, callback:(data: void | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlDeleteNodeById;
    url = url.replace('{id}', id);
    let data = await httpClient.get<void | null>(url);
    callback(data);
    completed?.();
  }

  async function getNodeDevicesStatus(nodeid: string, callback:(data: DeviceStatus[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetNodeDevicesStatus;
    url = url.replace('{id}', nodeid);

    let data = await httpClient.get<DeviceStatus[]>(url);
    callback(data);
    completed?.();
  }

  async function getDeviceTemplate(id: string, callback:(data: DeviceConfiguration[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetNodeDeviceTemplates;
    url = url.replace('{id}', id);
    let data = await httpClient.get<DeviceConfiguration[]>(url);
    callback(data);
    completed?.();
  }

  async function checkPlugin(plugin: PluginFile, callback:(data: PluginFile | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlCheckPlugin;
    let data = await httpClient.post<PluginFile, PluginFile>(url, plugin);
    callback(data);
    completed?.();
  }

  return {
    getNodes,
    getOnlineNodes,
    getNodeConfiguration,
    saveNodeConfiguration,
    deleteNode,
    getNodeDevicesStatus,
    getDeviceTemplate,
    checkPlugin
  };
}
