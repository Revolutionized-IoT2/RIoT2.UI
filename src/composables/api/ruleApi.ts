import { Constants } from '@/models/constants';
import { useHttpClient, withCallback } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { Rule } from '@/models/rules/rule';
import type { IRuleListItem } from '@/models/rules/IRuleListItem';
import type { IEvent } from '@/models/rules/Ievent';
import type FunctionTemplate from '@/models/rules/functionTemplate';
import type { FunctionEntity } from '@/models/rules/functionEntity';

export function useRuleApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  interface RuleSimulationPayload {
    id: string;
    data: any;
  }

  function getRules(callback:(data: IRuleListItem[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetRules;
    return withCallback(httpClient.get<IRuleListItem[] | null>(url), callback, completed);
  }

  function validateRule(id: string, callback:(data: string[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlRuleValidateById;
    url = url.replace('{id}', id);
    return withCallback(httpClient.get<string[] | null>(url), callback, completed);
  }

  function getRule(id: string, callback:(data: Rule | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetRuleById;
    url = url.replace('{id}', id);
    return withCallback(httpClient.get<Rule | null>(url), callback, completed);
  }

  function saveRule(rule: Rule, callback:(data: string | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlSaveRule;
    return withCallback(httpClient.post<Rule, string | null>(url, rule), callback, completed);
  }

  function simulateRule(id: string, data: any, callback:(data: IEvent[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlRuleSimulate;
    var obj: RuleSimulationPayload =  {
      id: id,
      data: data
    };

    return withCallback(httpClient.post<RuleSimulationPayload, IEvent[] | null>(url, obj), callback, completed);
  }

  function setRuleState(id: string, state: boolean, callback:(data: string | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlRuleSetStateById;
    url = url.replace('{id}', id);
    url = url.replace('{state}', state.toString().toLowerCase());
    return withCallback(httpClient.get<string | null>(url), callback, completed);
  }

  function deleteRule(id: string, callback:(data: void | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlDeleteRuleById;
    url = url.replace('{id}', id);
    return withCallback(httpClient.get<void | null>(url), callback, completed);
  }

  function getTags(callback:(data: string[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetTags;
    return withCallback(httpClient.get<string[] | null>(url), callback, completed);
  }

  function getFunctionTemplates(callback:(data: FunctionTemplate[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetFunctionTemplates;
    return withCallback(httpClient.get<FunctionTemplate[]>(url), callback, completed);
  }

  function runFunction(func: FunctionEntity, callback:(data:any) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlRunFunction;
    return withCallback(httpClient.post<FunctionEntity, any>(url, func), callback, completed);
  }

  return {
    getRules,
    validateRule,
    getRule,
    saveRule,
    simulateRule,
    setRuleState,
    deleteRule,
    getTags,
    getFunctionTemplates,
    runFunction
  };
}
