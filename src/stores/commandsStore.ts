import { defineStore } from 'pinia';
import { useCommandApi } from '@/composables/api/commandApi';
import { useRequests } from './requests';
import { useVariablesStore } from './variablesStore';
import type Command from '@/models/command';
import type { JsonValue } from '@/models/generated/contracts';
import type { Report } from '@/models/report';

/** Device commands, dashboard controls and the latest report and command states. */
export const useCommandsStore = defineStore('commands', () => {
  const api = useCommandApi();
  const variables = useVariablesStore();
  const { loading, error, run } = useRequests();

  /** The latest report, or the default from its template; null when unknown. */
  async function getReportState(id: string): Promise<Report | null> {
    return await run(() => api.getReportState(id)) ?? null;
  }

  async function getCommandState(id: string): Promise<Command | null> {
    return await run(() => api.getCommandState(id)) ?? null;
  }

  /** Queues a device command. Resolves to success. */
  async function execute(command: Command): Promise<boolean> {
    return await run(() => api.executeCommand(command)) !== undefined;
  }

  /**
   * A dashboard control's value. A variable's command template (address "variable") sets the
   * variable; any other template commands its device.
   */
  function send(template: { id: string, address?: string | null }, value: JsonValue): Promise<boolean> {
    const command: Command = { id: template.id, value };
    return template.address?.toLowerCase() == 'variable' ? variables.setValue(command) : execute(command);
  }

  return { loading, error, getReportState, getCommandState, execute, send };
});
