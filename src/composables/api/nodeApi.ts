import { Constants } from '@/models/constants';
import { useHttpClient, withCallback } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type SystemNode from '@/models/systemNode';
import NodeConfiguration from '@/models/nodeConfiguration';
import DeviceConfiguration from '@/models/deviceConfiguration';
import type DeviceStatus from '@/models/deviceStatus';
import type { PluginFile } from '@/models/rules/pluginFile';

export function useNodeApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  function getNodes(callback:(data: SystemNode[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetNodes;
    return withCallback(httpClient.get<SystemNode[]>(url), callback, completed);
  }

  function getOnlineNodes(callback:(data: SystemNode[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetNodesOnline;
    return withCallback(httpClient.get<SystemNode[]>(url), callback, completed);
  }

  function getNodeConfiguration(id: string, callback:(data: NodeConfiguration | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetNodeConfiguration;
    url = url.replace('{id}', id)

    return withCallback(httpClient.get<NodeConfiguration>(url), callback, completed);
  }

  function saveNodeConfiguration(configuration: Object, callback:(data:string | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlSaveNodeConfiguration;
    return withCallback(httpClient.post<Object, string | null>(url, configuration), callback, completed);
  }

  function deleteNode(id: string, callback:(data: void | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlDeleteNodeById;
    url = url.replace('{id}', id);
    return withCallback(httpClient.get<void | null>(url), callback, completed);
  }

  function getNodeDevicesStatus(nodeid: string, callback:(data: DeviceStatus[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetNodeDevicesStatus;
    url = url.replace('{id}', nodeid);

    return withCallback(httpClient.get<DeviceStatus[]>(url), callback, completed);
  }

  function getDeviceTemplate(id: string, callback:(data: DeviceConfiguration[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetNodeDeviceTemplates;
    url = url.replace('{id}', id);
    return withCallback(httpClient.get<DeviceConfiguration[]>(url), callback, completed);
  }

  function checkPlugin(plugin: PluginFile, callback:(data: PluginFile | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlCheckPlugin;
    return withCallback(httpClient.post<PluginFile, PluginFile>(url, plugin), callback, completed);
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
