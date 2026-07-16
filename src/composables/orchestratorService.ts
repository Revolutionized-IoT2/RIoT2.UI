import { useDashboardApi } from '@/composables/api/dashboardApi';
import { useNodeApi } from '@/composables/api/nodeApi';
import { useRuleApi } from '@/composables/api/ruleApi';
import { useVariableApi } from '@/composables/api/variableApi';
import { useCommandApi } from '@/composables/api/commandApi';

/**
 * Facade over the domain-specific API composables (dashboard, node, rule,
 * variable, command). Kept so existing call sites (`orchestrator.xyz(...)`)
 * don't need to change; new code can also import the domain composables
 * directly (e.g. `useRuleApi()`) instead of going through this facade.
 */
export function useOrchestrator() {

  const dashboardApi = useDashboardApi();
  const nodeApi = useNodeApi();
  const ruleApi = useRuleApi();
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

    // rules
    getRules: ruleApi.getRules,
    validateRule: ruleApi.validateRule,
    getRule: ruleApi.getRule,
    saveRule: ruleApi.saveRule,
    simulateRule: ruleApi.simulateRule,
    setRuleState: ruleApi.setRuleState,
    deleteRule: ruleApi.deleteRule,
    getTags: ruleApi.getTags,
    getFunctionTemplates: ruleApi.getFunctionTemplates,
    runFunction: ruleApi.runFunction,

    // variables
    getVariables: variableApi.getVariables,
    saveVariable: variableApi.saveVariable,
    deleteVariable: variableApi.deleteVariable,
    getVariableTemplates: variableApi.getVariableTemplates,

    // commands / reports
    getReportTemplates: commandApi.getReportTemplates,
    getCommandTemplates: commandApi.getCommandTemplates,
    getReportState: commandApi.getReportState,
    getCommandState: commandApi.getCommandState,
    sendCommand: commandApi.sendCommand,
    executeCommand: commandApi.executeCommand,
    validateCron: commandApi.validateCron
  }
}