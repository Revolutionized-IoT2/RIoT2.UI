import { Constants } from './../models/constants';
import { ComponentElement } from './../models/componentElement';
import { ref } from 'vue'

import { useHttpClient } from './httpClientService';
import type SystemNode from '@/models/systemNode';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import Dashboard from '@/models/dashboard';
import type { ReportTemplate } from '@/models/rules/reportTemplate';
import type CommandTemplate from '@/models/commandTemplate';
import type FunctionTemplate from '@/models/rules/functionTemplate';
import type { FunctionEntity } from '@/models/rules/functionEntity';
import type Command from '@/models/command';
import type Report from '@/models/report';
import type { Variable } from '@/models/rules/variable';
import type VariableTemplate from '@/models/variableTemplate';
import type { Rule } from '@/models/rules/rule';
import type { IRuleListItem } from '@/models/rules/IRuleListItem';
import type { IRule } from '@/models/rules/IRule';
import type { IEvent } from '@/models/rules/Ievent';
import NodeConfiguration from '@/models/nodeConfiguration';
import DeviceConfiguration from '@/models/deviceConfiguration';
import { OutputOperation } from '@/models/enums';

export function useOrchestrator() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  function loadDashboardConfiguration(callback:(dashboard: Dashboard | null) => void, completed?:()=> void): void {

    let dashboardUrl = orchestratorStore.baseUrl + Constants.urlGetDashboardConfigurationWithHistory;
    httpClient.get<Dashboard>(dashboardUrl, (dashboard: Dashboard | null) => {

      if(dashboard == null || dashboard.pages == null)
        dashboard = new Dashboard();

      //ComponentElements must be initialized in order then to work properly
      for(let page of dashboard.pages) {
        for(let component of page.components) {
          let initializedElems: ComponentElement[] = [];
          for(let elem of component.elements) { 
            initializedElems.push(new ComponentElement(elem));
          }
          component.elements = initializedElems;
        }
      }
      
      callback(dashboard);
    }, completed);
  }

  function saveDashboard(dashboard: Dashboard, callback:(data: string | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlSaveDashboard;
    httpClient.post<Dashboard, string | null>(url, dashboard, callback, completed);
  }

  function getReportTemplates(callback:(data: ReportTemplate[] | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetReportTemplates;
    httpClient.get<ReportTemplate[]>(url, callback, completed);
  }

  function getCommandTemplates(callback:(data: CommandTemplate[] | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetCommandTemplates;
    httpClient.get<CommandTemplate[]>(url, callback, completed);
  }

  function getFunctionTemplates(callback:(data: FunctionTemplate[] | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetFunctionTemplates;
    httpClient.get<FunctionTemplate[]>(url, callback, completed);
  }

  function getReportState(id: string, callback:(data: Report | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetReportOrCommandState;
    url = url.replace('{id}', id);
    url = url.replace('{type}', "report");
    httpClient.get<Report>(url, callback, completed);
  }

  function getCommandState(id: string, callback:(data: Command | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetReportOrCommandState;
    url = url.replace('{id}', id);
    url = url.replace('{type}', "command");
    httpClient.get<Command>(url, callback, completed);
  }

  function getNodes(callback:(data: SystemNode[] | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetNodes;
    httpClient.get<SystemNode[]>(url, callback, completed);
  }

  function getNodeConfiguration(id: string, callback:(data: NodeConfiguration | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetNodeConfiguration;
    url = url.replace('{id}', id)

    httpClient.get<NodeConfiguration>(url, callback, completed);
  }

  function saveNodeConfiguration(configuration: Object, callback:(data:string | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlSaveNodeConfiguration;
    httpClient.post<Object, string | null>(url, configuration, callback, completed);
  }

  function runFunction(func: FunctionEntity, callback:(data:any) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlRunFunction;
    httpClient.post<FunctionEntity, any>(url, func, callback, completed);
  }

  function deleteVariable(id: string, callback:(data: void | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlDeleteVariable;
    url = url.replace('{id}', id);
    httpClient.get<void>(url, callback, completed);
  }

  function saveVariable(variable: Variable, callback:(data: void | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlSaveVariable;
    httpClient.post<Variable, void | null>(url, variable, callback, completed);
  }

  function sendCommand(operation: OutputOperation, command: Command, callback:(data: void | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlSendCommand;
    url = url.replace('{operation}', (operation as number).toString());
    httpClient.post<Variable, void | null>(url, command, callback, completed);
  }

  function getVariables(callback:(data: Variable[] | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetVariables;
    httpClient.get<Variable[] | null>(url, callback, completed);
  }

  function getVariableTemplates(callback:(data: VariableTemplate[] | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetVariableTemplates;
    httpClient.get<VariableTemplate[] | null>(url, callback, completed);
  }

  function getRules(callback:(data: IRuleListItem[] | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetRules;
    httpClient.get<IRuleListItem[] | null>(url, callback, completed);
  }

  function validateRule(id: string, callback:(data: string[] | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlRuleValidateById;
    url = url.replace('{id}', id);
    httpClient.get<string[] | null>(url, callback, completed);
  }

  function getRule(id: string, callback:(data: Rule | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetRuleById;
    url = url.replace('{id}', id);
    httpClient.get<Rule | null>(url, callback, completed);
  }

  function getTags(callback:(data: string[] | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetTags;
    httpClient.get<string[] | null>(url, callback, completed);
  }

  function setRuleState(id: string, state: boolean, callback:(data: string | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlRuleSetStateById;
    url = url.replace('{id}', id);
    url = url.replace('{state}', state.toString().toLowerCase());
    httpClient.get<string | null>(url, callback, completed);
  }

  function deleteRule(id: string, callback:(data: void | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlDeleteRuleById;
    url = url.replace('{id}', id);
    httpClient.get<void | null>(url, callback, completed);
  }

  function saveRule(rule: Rule, callback:(data: string | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlSaveRule;
    httpClient.post<Rule, string | null>(url, rule, callback, completed);
  }

  function simulateRule(id: string, data: any, callback:(data: IEvent[] | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlRuleSimulate;
    var obj =  {
      id: id,
      data: data
    };

    httpClient.post<any, IEvent[] | null>(url, obj, callback, completed);
  }

  function deleteNode(id: string, callback:(data: void | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlDeleteNodeById;
    url = url.replace('{id}', id);
    httpClient.get<void | null>(url, callback, completed);
  }

  function getOnlineNodes(callback:(data: SystemNode[] | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetNodesOnline;
    httpClient.get<SystemNode[]>(url, callback, completed);
  }

  function getDeviceTemplate(id: string, callback:(data: DeviceConfiguration[] | null) => void, completed?:()=> void) {

    let url = orchestratorStore.baseUrl + Constants.urlGetDeviceTemplateById;
    url = url.replace('{id}', id);
    httpClient.get<DeviceConfiguration[]>(url, callback, completed);
  }

  
  /*
  function updateDashboardHistory(id: string, callback:(data: Report[] | null) => void ) {
    let url = baseUrl + Constants.urlGetReportHistory;
    url = url.replace('{id}', id);

    httpClient.get<Report[]>(url, callback);
  }*/

  return {
    getDashboard: loadDashboardConfiguration,
    getNodes: getNodes,
    getReportTemplates: getReportTemplates,
    getCommandTemplates: getCommandTemplates,
    getFunctionTemplates: getFunctionTemplates,
    getCommandState: getCommandState,
    getReportState: getReportState,
    getNodeConfiguration: getNodeConfiguration,
    saveNodeConfiguration: saveNodeConfiguration,
    runFunction: runFunction,
    getVariables: getVariables,
    saveVariable: saveVariable,
    deleteVariable: deleteVariable,
    getVariableTemplates: getVariableTemplates,
    getRules: getRules,
    validateRule: validateRule,
    getRule: getRule,
    saveRule: saveRule,
    simulateRule: simulateRule,
    setRuleState: setRuleState,
    deleteRule: deleteRule,
    getTags: getTags,
    deleteNode: deleteNode,
    getOnlineNodes: getOnlineNodes,
    saveDashboard: saveDashboard,
    getDeviceTemplate: getDeviceTemplate,
    sendCommand: sendCommand
  }
}