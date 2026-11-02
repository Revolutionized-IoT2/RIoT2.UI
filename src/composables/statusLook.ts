import type { CommandDelivery, CommandDeliveryStatus } from '@/models/commandDelivery';
import type { NodeSync } from '@/models/nodeSync';

/** How a sync or command status is shown: a label, a Vuetify color, a Material icon and detail lines. */
export interface StatusLook {
  label: string;
  color: string;
  icon: string;
  detail: string[];
}

function revisions(node: NodeSync): string | null {
  if (node.desiredRevision == null)
    return null;
  return `Revision ${node.appliedRevision ?? '–'} of ${node.desiredRevision}`;
}

function plugin(node: NodeSync): string | null {
  const manifest = node.pluginManifest;
  if (manifest == null)
    return null;
  const core = manifest.coreVersion ? `, RIoT2.Core ${manifest.coreVersion}` : '';
  return `Plugin ${manifest.name ?? manifest.installedPackageFilename ?? ''} ${manifest.version ?? ''}${core}`.replace(/\s+/g, ' ').trim();
}

function lines(...values: (string | null | undefined)[]): string[] {
  return values.filter((v): v is string => v != null && v !== '');
}

/**
 * A node's configuration sync (design 7.2 phase 6): "in sync", "applying" (or "restarting" for a
 * new plugin package), "failed" with the error, "offline" while a pending node is away, and
 * "legacy" for nodes that don't report their configuration.
 */
export function syncLook(node: NodeSync): StatusLook {
  const revision = revisions(node);
  const pluginLine = plugin(node);
  switch (node.syncState) {
    case 'inSync': {
      const failed = node.failedDevices ?? [];
      if (failed.length > 0)
        return {
          label: 'in sync', color: 'orange', icon: 'warning',
          detail: lines(revision, `${failed.length} device(s) not running:`, ...failed.map(d => `${d.id}: ${d.message ?? ''}`), pluginLine)
        };
      return { label: 'in sync', color: 'green', icon: 'check_circle', detail: lines(revision, pluginLine) };
    }
    case 'failed':
      return { label: 'failed', color: 'red', icon: 'error', detail: lines(node.lastError ?? 'The configuration could not be applied.', revision, pluginLine) };
    case 'legacy':
      return { label: 'legacy', color: 'grey', icon: 'help_outline', detail: lines("The node doesn't report its configuration.", pluginLine) };
    case 'pending':
      if (!node.isOnline)
        return { label: 'offline', color: 'grey', icon: 'cloud_off', detail: lines('The node gets its configuration when it comes online.', revision, pluginLine) };
      if (node.configurationState == 'pendingRestart')
        return { label: 'restarting', color: 'blue', icon: 'restart_alt', detail: lines('The node restarts to install a new plugin package.', revision, pluginLine) };
      return { label: 'applying', color: 'blue', icon: 'sync', detail: lines(revision, pluginLine) };
    default:
      return { label: 'unknown', color: 'grey', icon: 'help_outline', detail: lines('The orchestrator reports no sync state.') };
  }
}

/** Whether a delivery status means the command didn't run. */
export function isCommandFailure(status: CommandDeliveryStatus): boolean {
  return status == 'failed' || status == 'unknownCommand' || status == 'expired';
}

/** A command delivery (design 7.1 phase 4): "sending", "done", "sent" (no result expected) or the failure. */
export function commandLook(delivery: CommandDelivery): StatusLook {
  const error = delivery.error ? [delivery.error] : [];
  switch (delivery.status) {
    case 'pending':
      return { label: 'sending', color: 'blue', icon: 'schedule', detail: delivery.attempts > 0 ? [`Attempt ${delivery.attempts + 1}`, ...error] : [] };
    case 'executed':
    case 'duplicate':
      return { label: 'done', color: 'green', icon: 'check_circle', detail: [] };
    case 'sent':
      return { label: 'sent', color: 'grey', icon: 'done', detail: ["The node doesn't report results."] };
    case 'unknownCommand':
      return { label: 'unknown command', color: 'red', icon: 'error', detail: ['No device on the node owns the command.', ...error] };
    case 'expired':
      return { label: 'expired', color: 'red', icon: 'error', detail: ["The node didn't answer in time.", ...error] };
    default:
      return { label: 'failed', color: 'red', icon: 'error', detail: error };
  }
}
