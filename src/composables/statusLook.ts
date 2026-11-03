import type { CommandDelivery, CommandDeliveryStatus } from '@/models/commandDelivery';
import type { ConnectorInfo } from '@/models/connectorInfo';
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
          label: 'in sync', color: 'orange', icon: 'mdi-alert',
          detail: lines(revision, `${failed.length} device(s) not running:`, ...failed.map(d => `${d.id}: ${d.message ?? ''}`), pluginLine)
        };
      return { label: 'in sync', color: 'green', icon: 'mdi-check-circle', detail: lines(revision, pluginLine) };
    }
    case 'failed':
      return { label: 'failed', color: 'red', icon: 'mdi-alert-circle', detail: lines(node.lastError ?? 'The configuration could not be applied.', revision, pluginLine) };
    case 'legacy':
      return { label: 'legacy', color: 'grey', icon: 'mdi-help-circle-outline', detail: lines("The node doesn't report its configuration.", pluginLine) };
    case 'pending':
      if (!node.isOnline)
        return { label: 'offline', color: 'grey', icon: 'mdi-cloud-off-outline', detail: lines('The node gets its configuration when it comes online.', revision, pluginLine) };
      if (node.configurationState == 'pendingRestart')
        return { label: 'restarting', color: 'blue', icon: 'mdi-restart', detail: lines('The node restarts to install a new plugin package.', revision, pluginLine) };
      return { label: 'applying', color: 'blue', icon: 'mdi-sync', detail: lines(revision, pluginLine) };
    default:
      return { label: 'unknown', color: 'grey', icon: 'mdi-help-circle-outline', detail: lines('The orchestrator reports no sync state.') };
  }
}

/** Whether a delivery status means the command didn't run. */
export function isCommandFailure(status: CommandDeliveryStatus): boolean {
  return status == 'failed' || status == 'unknownCommand' || status == 'expired';
}

function megabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The spool line of a connector's health: how much waits on disk, or null when nothing does. */
export function spoolLine(connector: ConnectorInfo): string | null {
  const spool = connector.health?.spool;
  if (spool == null || !spool.enabled || spool.messages <= 0)
    return null;
  return `${spool.messages} message(s) wait in the spool (${megabytes(spool.bytes)} of ${megabytes(spool.maxBytes)})`;
}

/**
 * A connector's health (design 7.3 phases 2–3): "ok", "degraded" (the target doesn't answer, or messages wait
 * in the spool), "unhealthy" (no MQTT), "unreachable" when its /health doesn't answer, and "online" when it
 * announced no URL.
 */
export function connectorLook(connector: ConnectorInfo): StatusLook {
  if (connector.nodeBaseUrl == null || connector.nodeBaseUrl === '')
    return { label: 'online', color: 'green', icon: 'mdi-cloud-check-outline', detail: ['Set RIOT2_CONNECTOR_URL on the connector to see its health.'] };
  const health = connector.health;
  if (health == null)
    return { label: 'unreachable', color: 'orange', icon: 'mdi-cloud-off-outline', detail: lines(connector.healthError ?? 'The connector did not answer.', connector.nodeBaseUrl) };
  const spool = spoolLine(connector);
  switch (health.status) {
    case 'ok':
      return { label: 'ok', color: 'green', icon: 'mdi-check-circle', detail: [] };
    case 'degraded':
      return {
        label: 'degraded', color: 'orange', icon: 'mdi-alert',
        detail: lines(health.sink ? null : "The connector's target doesn't answer.", spool)
      };
    case 'unhealthy':
      return {
        label: 'unhealthy', color: 'red', icon: 'mdi-alert-circle',
        detail: lines(health.mqtt ? null : 'Not connected to MQTT.', health.sink ? null : "The connector's target doesn't answer.", spool)
      };
    default:
      return { label: 'unknown', color: 'grey', icon: 'mdi-help-circle-outline', detail: lines(`Health status "${health.status}"`, spool) };
  }
}

/** A command delivery (design 7.1 phase 4): "sending", "done", "sent" (no result expected) or the failure. */
export function commandLook(delivery: CommandDelivery): StatusLook {
  const error = delivery.error ? [delivery.error] : [];
  switch (delivery.status) {
    case 'pending':
      return { label: 'sending', color: 'blue', icon: 'mdi-clock-outline', detail: delivery.attempts > 0 ? [`Attempt ${delivery.attempts + 1}`, ...error] : [] };
    case 'executed':
    case 'duplicate':
      return { label: 'done', color: 'green', icon: 'mdi-check-circle', detail: [] };
    case 'sent':
      return { label: 'sent', color: 'grey', icon: 'mdi-check', detail: ["The node doesn't report results."] };
    case 'unknownCommand':
      return { label: 'unknown command', color: 'red', icon: 'mdi-alert-circle', detail: ['No device on the node owns the command.', ...error] };
    case 'expired':
      return { label: 'expired', color: 'red', icon: 'mdi-alert-circle', detail: ["The node didn't answer in time.", ...error] };
    default:
      return { label: 'failed', color: 'red', icon: 'mdi-alert-circle', detail: error };
  }
}
