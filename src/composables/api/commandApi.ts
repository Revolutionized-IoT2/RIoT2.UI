import { Constants } from '@/models/constants';
import { useHttpClient, withCallback } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type CommandTemplate from '@/models/commandTemplate';
import type Command from '@/models/command';
import type { Report } from '@/models/report';
import type { ReportTemplate } from '@/models/rules/reportTemplate';
import type { CronValidationResult } from '@/models/cronValidationResult';
import { OutputOperation } from '@/models/enums';

export function useCommandApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  function getReportTemplates(callback:(data: ReportTemplate[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetReportTemplates;
    return withCallback(httpClient.get<ReportTemplate[]>(url), callback, completed);
  }

  function getCommandTemplates(callback:(data: CommandTemplate[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetCommandTemplates;
    return withCallback(httpClient.get<CommandTemplate[]>(url), callback, completed);
  }

  function getReportState(id: string, callback:(data: Report | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetReportOrCommandState;
    url = url.replace('{id}', id);
    url = url.replace('{type}', "report");
    return withCallback(httpClient.get<Report>(url), callback, completed);
  }

  function getCommandState(id: string, callback:(data: Command | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetReportOrCommandState;
    url = url.replace('{id}', id);
    url = url.replace('{type}', "command");
    return withCallback(httpClient.get<Command>(url), callback, completed);
  }

  function sendCommand(operation: OutputOperation, command: Command, callback:(data: void | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlSendCommand;
    url = url.replace('{operation}', (operation as number).toString());
    return withCallback(httpClient.post<Command, void | null>(url, command), callback, completed);
  }

  function executeCommand(command: Command, callback:(data: void | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlExecuteCommand;
    return withCallback(httpClient.post<Command, void | null>(url, command), callback, completed);
  }

  function validateCron(cron: CronValidationResult, callback:(data: CronValidationResult | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlValidateCron;
    return withCallback(httpClient.post<CronValidationResult, CronValidationResult>(url, cron), callback, completed);
  }

  return {
    getReportTemplates,
    getCommandTemplates,
    getReportState,
    getCommandState,
    sendCommand,
    executeCommand,
    validateCron
  };
}
