import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
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

  async function getReportTemplates(callback:(data: ReportTemplate[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetReportTemplates;
    let data = await httpClient.get<ReportTemplate[]>(url);
    callback(data);
    completed?.();
  }

  async function getCommandTemplates(callback:(data: CommandTemplate[] | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetCommandTemplates;
    let data = await httpClient.get<CommandTemplate[]>(url);
    callback(data);
    completed?.();
  }

  async function getReportState(id: string, callback:(data: Report | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetReportOrCommandState;
    url = url.replace('{id}', id);
    url = url.replace('{type}', "report");
    let data = await httpClient.get<Report>(url);
    callback(data);
    completed?.();
  }

  async function getCommandState(id: string, callback:(data: Command | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetReportOrCommandState;
    url = url.replace('{id}', id);
    url = url.replace('{type}', "command");
    let data = await httpClient.get<Command>(url);
    callback(data);
    completed?.();
  }

  async function sendCommand(operation: OutputOperation, command: Command, callback:(data: void | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlSendCommand;
    url = url.replace('{operation}', (operation as number).toString());
    let data = await httpClient.post<Command, void | null>(url, command);
    callback(data);
    completed?.();
  }

  async function executeCommand(command: Command, callback:(data: void | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlExecuteCommand;
    let data = await httpClient.post<Command, void | null>(url, command);
    callback(data);
    completed?.();
  }

  async function validateCron(cron: CronValidationResult, callback:(data: CronValidationResult | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlValidateCron;
    let data = await httpClient.post<CronValidationResult, CronValidationResult>(url, cron);
    callback(data);
    completed?.();
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
