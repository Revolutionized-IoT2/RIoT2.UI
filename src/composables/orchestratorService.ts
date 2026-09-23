import { useDashboardApi } from '@/composables/api/dashboardApi';
import { useNodeApi } from '@/composables/api/nodeApi';
import { useVariableApi } from '@/composables/api/variableApi';
import { useCommandApi } from '@/composables/api/commandApi';

/**
 * Facade over the domain-specific API composables (dashboard, node,
 * variable, command). Kept so existing call sites (`orchestrator.xyz(...)`)
 * don't need to change; new code can also import the domain composables
 * directly (e.g. `useNodeApi()`) instead of going through this facade.
 */
export function useOrchestrator() {

  const dashboardApi = useDashboardApi();
  const nodeApi = useNodeApi();
  const variableApi = useVariableApi();
  const commandApi = useCommandApi();

  return {
    // dashboard
    getDashboard: dashboardApi.getDashboard,
    saveDashboard: dashboardApi.saveDashboard,

    // nodes
    getNodes: nodeApi.getNodes,
    getOnlineNodes: nodeApi.getOnlineNodes,
    getNodeConfiguration: nodeApi.getNodeConfiguration,
    saveNodeConfiguration: nodeApi.saveNodeConfiguration,
    deleteNode: nodeApi.deleteNode,
    getNodeDevicesStatus: nodeApi.getNodeDevicesStatus,
    getDeviceTemplate: nodeApi.getDeviceTemplate,
    checkPlugin: nodeApi.checkPlugin,

    // variables
    getVariables: variableApi.getVariables,
    saveVariable: variableApi.saveVariable,
    setVariableValue: variableApi.setVariableValue,
    deleteVariable: variableApi.deleteVariable,
    getVariableTemplates: variableApi.getVariableTemplates,

    // commands / reports
    getReportTemplates: commandApi.getReportTemplates,
    getCommandTemplates: commandApi.getCommandTemplates,
    getReportState: commandApi.getReportState,
    getCommandState: commandApi.getCommandState,
    executeCommand: commandApi.executeCommand,
    validateCron: commandApi.validateCron
  }
}