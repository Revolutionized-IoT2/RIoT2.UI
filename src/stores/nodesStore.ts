import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useNodeApi } from '@/composables/api/nodeApi';
import { useRequests } from './requests';
import { useTemplatesStore } from './templatesStore';
import { NodeType } from '@/models/enums';
import type SystemNode from '@/models/systemNode';
import type NodeConfiguration from '@/models/nodeConfiguration';
import type DeviceConfiguration from '@/models/deviceConfiguration';
import type DeviceStatus from '@/models/deviceStatus';
import type { PluginFile } from '@/models/pluginFile';
import type { CronValidationResult } from '@/models/cronValidationResult';

/** Configured and online nodes, and the node editor's requests. */
export const useNodesStore = defineStore('nodes', () => {
  const api = useNodeApi();
  const templates = useTemplatesStore();
  const { loading, error, run } = useRequests();

  const nodes = ref<SystemNode[]>([]);
  const onlineNodes = ref<SystemNode[]>([]);

  /** The online workflow engine (Elsa), which the menu links to. */
  const workflowNode = computed(() => onlineNodes.value.find(x => x.nodeType == NodeType.workflow));

  async function load(): Promise<void> {
    await Promise.all([
      run(async () => { nodes.value = await api.getNodes() ?? []; }),
      loadOnline(),
    ]);
  }

  async function loadOnline(): Promise<void> {
    await run(async () => { onlineNodes.value = await api.getOnlineNodes() ?? []; });
  }

  async function getConfiguration(id: string): Promise<NodeConfiguration | null> {
    return await run(() => api.getNodeConfiguration(id)) ?? null;
  }

  /** Saves a configuration, then reloads the nodes and the templates. Resolves to success. */
  async function saveConfiguration(configuration: NodeConfiguration): Promise<boolean> {
    const id = await run(() => api.saveNodeConfiguration(configuration));
    if (id == null)
      return false;
    await Promise.all([load(), templates.load()]);
    return true;
  }

  /** Deletes a node, then reloads the nodes and the templates. Resolves to success. */
  async function deleteNode(id: string): Promise<boolean> {
    if (await run(() => api.deleteNode(id)) === undefined)
      return false;
    await Promise.all([load(), templates.load()]);
    return true;
  }

  async function getDeviceTemplates(nodeId: string): Promise<DeviceConfiguration[]> {
    return await run(() => api.getDeviceTemplates(nodeId)) ?? [];
  }

  async function getDeviceStatuses(nodeId: string): Promise<DeviceStatus[]> {
    return await run(() => api.getNodeDevicesStatus(nodeId)) ?? [];
  }

  async function checkPlugin(url: string): Promise<PluginFile | null> {
    return await run(() => api.checkPlugin({ url })) ?? null;
  }

  async function validateCron(expression: string): Promise<CronValidationResult | null> {
    return await run(() => api.validateCron({ expression })) ?? null;
  }

  return {
    nodes, onlineNodes, workflowNode, loading, error,
    load, loadOnline, getConfiguration, saveConfiguration, deleteNode,
    getDeviceTemplates, getDeviceStatuses, checkPlugin, validateCron
  };
});
