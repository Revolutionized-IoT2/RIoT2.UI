import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { Rule } from '@/models/rules/rule';
import type { IRuleListItem } from '@/models/rules/IRuleListItem';
import type { IEvent } from '@/models/rules/Ievent';
import type FunctionTemplate from '@/models/rules/functionTemplate';
import type { FunctionEntity } from '@/models/rules/functionEntity';

export function useRuleApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  async function getRules(callback:(data: IRuleListItem[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetRules;
    let data = await httpClient.get<IRuleListItem[] | null>(url);
    callback(data);
    completed?.();
  }

  async function validateRule(id: string, callback:(data: string[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlRuleValidateById;
    url = url.replace('{id}', id);
    let data = await httpClient.get<string[] | null>(url);
    callback(data);
    completed?.();
  }

  async function getRule(id: string, callback:(data: Rule | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetRuleById;
    url = url.replace('{id}', id);
    let data = await httpClient.get<Rule | null>(url);
    callback(data);
    completed?.();
  }

  async function saveRule(rule: Rule, callback:(data: string | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlSaveRule;
    let data = await httpClient.post<Rule, string | null>(url, rule);
    callback(data);
    completed?.();
  }

  async function simulateRule(id: string, data: any, callback:(data: IEvent[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlRuleSimulate;
    var obj =  {
      id: id,
      data: data
    };

    let result = await httpClient.post<any, IEvent[] | null>(url, obj);
    callback(result);
    completed?.();
  }

  async function setRuleState(id: string, state: boolean, callback:(data: string | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlRuleSetStateById;
    url = url.replace('{id}', id);
    url = url.replace('{state}', state.toString().toLowerCase());
    let data = await httpClient.get<string | null>(url);
    callback(data);
    completed?.();
  }

  async function deleteRule(id: string, callback:(data: void | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlDeleteRuleById;
    url = url.replace('{id}', id);
    let data = await httpClient.get<void | null>(url);
    callback(data);
    completed?.();
  }

  async function getTags(callback:(data: string[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetTags;
    let data = await httpClient.get<string[] | null>(url);
    callback(data);
    completed?.();
  }

  async function getFunctionTemplates(callback:(data: FunctionTemplate[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetFunctionTemplates;
    let data = await httpClient.get<FunctionTemplate[]>(url);
    callback(data);
    completed?.();
  }

  async function runFunction(func: FunctionEntity, callback:(data:any) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlRunFunction;
    let data = await httpClient.post<FunctionEntity, any>(url, func);
    callback(data);
    completed?.();
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
