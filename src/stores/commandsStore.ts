import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useCommandApi } from '@/composables/api/commandApi';
import { isCommandFailure } from '@/composables/statusLook';
import { useRequests } from './requests';
import { useErrorStore } from './errorStore';
import { useVariablesStore } from './variablesStore';
import AppError from '@/models/appError';
import type Command from '@/models/command';
import type { CommandDelivery, OutboxSummary } from '@/models/commandDelivery';
import type { JsonValue } from '@/models/generated/contracts';
import type { Report } from '@/models/report';

/** How often a pending delivery is asked for, and for how long after it expires at most. */
export const deliveryPollMilliseconds = 500;
const deliveryGraceMilliseconds = 5000;

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Device commands with their delivery status (design 7.1 phase 4), dashboard controls, the outbox
 * summary, and the latest report and command states.
 */
export const useCommandsStore = defineStore('commands', () => {
  const api = useCommandApi();
  const variables = useVariablesStore();
  const errors = useErrorStore();
  const { loading, error, run } = useRequests();

  /** The latest delivery per command (template) id, for the dashboard's status indicators. */
  const deliveries = ref<Record<string, CommandDelivery>>({});
  const tracking = new Map<string, Promise<void>>();
  const outbox = ref<OutboxSummary | null>(null);

  /** The latest report, or the default from its template; null when unknown. */
  async function getReportState(id: string): Promise<Report | null> {
    return await run(() => api.getReportState(id)) ?? null;
  }

  async function getCommandState(id: string): Promise<Command | null> {
    return await run(() => api.getCommandState(id)) ?? null;
  }

  /**
   * Queues a device command and follows its delivery until it is final: `deliveries[command.id]`
   * changes from pending to executed, sent or a failure, and a failure reaches the snackbar.
   * Resolves to whether the command was queued.
   */
  async function execute(command: Command): Promise<boolean> {
    const delivery = await run(() => api.sendCommand(command));
    if (delivery == null)
      return false;
    tracking.set(command.id, follow(command.id, delivery));
    return true;
  }

  /** Resolves when the latest delivery of the command is final or no longer followed. */
  function settled(commandId: string): Promise<void> {
    return tracking.get(commandId) ?? Promise.resolve();
  }

  async function follow(commandId: string, delivery: CommandDelivery): Promise<void> {
    deliveries.value[commandId] = delivery;
    const deadline = Math.max(Date.parse(delivery.expires) || 0, Date.now()) + deliveryGraceMilliseconds;
    let current = delivery;
    const superseded = () => deliveries.value[commandId]?.correlationId != delivery.correlationId;
    while (!current.isFinal && Date.now() < deadline) {
      await delay(deliveryPollMilliseconds);
      // A newer command for the same id takes over, also while a request for this one is answered.
      if (superseded())
        return;
      let answer: CommandDelivery | null;
      try {
        answer = await api.getDelivery(delivery.correlationId);
      } catch {
        continue;
      }
      if (superseded())
        return;
      current = answer ?? current;
      deliveries.value[commandId] = current;
    }
    if (current.isFinal && isCommandFailure(current.status))
      errors.setError(new AppError(`Command ${commandId} ${current.status}`, current.error ?? ''));
  }

  /**
   * A dashboard control's value. A variable's command template (address "variable") sets the
   * variable; any other template commands its device.
   */
  function send(template: { id: string, address?: string | null }, value: JsonValue): Promise<boolean> {
    const command: Command = { id: template.id, value };
    return template.address?.toLowerCase() == 'variable' ? variables.setValue(command) : execute(command);
  }

  /** Loads the outbox summary (GET /api/v2/outbox/summary). Resolves to success. */
  async function loadOutbox(): Promise<boolean> {
    const summary = await run(() => api.getOutboxSummary());
    if (summary === undefined)
      return false;
    outbox.value = summary;
    return true;
  }

  return { loading, error, deliveries, outbox, getReportState, getCommandState, execute, settled, send, loadOutbox };
});
