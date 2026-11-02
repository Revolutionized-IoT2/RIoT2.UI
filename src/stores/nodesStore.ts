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
import type { NodeSync } from '@/models/nodeSync';
import type { ConnectorInfo } from '@/models/connectorInfo';

/** Configured and online nodes, and the node editor's requests. */
export const useNodesStore = defineStore('nodes', () => {
  const api = useNodeApi();
  const templates = useTemplatesStore();
  const { loading, error, run } = useRequests();

  const nodes = ref<SystemNode[]>([]);
  const onlineNodes = ref<SystemNode[]>([]);
  /** The online connectors (design 7.3 phase 3), listed apart from the nodes. */
  const connectors = ref<ConnectorInfo[]>([]);

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

  /**
   * Updates the nodes' sync fields from GET /api/v2/nodes/sync (design 7.2 phase 6). Meant to be
   * polled: it doesn't set `loading`, and a failure keeps the last state without a snackbar.
   */
  async function refreshSync(): Promise<void> {
    let sync: NodeSync[] | null;
    try {
      sync = await api.getSync();
    } catch {
      return;
    }
    for (const entry of sync ?? []) {
      const node = nodes.value.find(n => n.id == entry.id);
      if (node == null)
        continue;
      const cameOnline = !node.isOnline && entry.isOnline;
      node.isOnline = entry.isOnline;
      // An offline node's device states are unknown, not the ones it last reported.
      if (!entry.isOnline)
        node.deviceStatuses = [];
      else if (cameOnline)
        api.getNodeDevicesStatus(node.id).then(statuses => { node.deviceStatuses = statuses ?? []; }, () => {});
      node.pluginManifest = entry.pluginManifest ?? node.pluginManifest;
      node.desiredRevision = entry.desiredRevision;
      node.appliedRevision = entry.appliedRevision;
      node.syncState = entry.syncState;
      node.configurationState = entry.configurationState;
      node.lastError = entry.lastError;
      node.failedDevices = entry.failedDevices;
    }
  }

  /** Sends a node its configuration again ("re-apply"). Resolves to success. */
  async function reapply(id: string): Promise<boolean> {
    if (await run(() => api.applyConfiguration(id)) === undefined)
      return false;
    await refreshSync();
    return true;
  }

  /**
   * Reloads the connectors and their health. Meant to be polled: it doesn't set `loading`, and a failure (an
   * orchestrator before 1.17.0 answers 404) keeps the last list without a snackbar.
   */
  async function loadConnectors(): Promise<void> {
    try {
      connectors.value = await api.getConnectors() ?? [];
    } catch {
      // Keep the last list.
    }
  }

  return {
    nodes, onlineNodes, connectors, workflowNode, loading, error,
    load, loadOnline, loadConnectors, getConfiguration, saveConfiguration, deleteNode,
    getDeviceTemplates, getDeviceStatuses, checkPlugin, validateCron, refreshSync, reapply
  };
});
