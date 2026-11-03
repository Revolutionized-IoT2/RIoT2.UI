import { DeviceState, NodeType } from '@/models/enums';
import type { DeviceHealth, NodeHealth, PresenceEvent, SystemHealth } from '@/models/systemHealth';
import { syncLook, type StatusLook } from '@/composables/statusLook';

/** "45 s", "12 min", "3 h 5 min" or "2 d 4 h". */
export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60)
    return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60)
    return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)
    return m % 60 == 0 ? `${h} h` : `${h} h ${m % 60} min`;
  const d = Math.floor(h / 24);
  return h % 24 == 0 ? `${d} d` : `${d} d ${h % 24} h`;
}

export function nodeTypeLabel(type: NodeType): string {
  switch (type) {
    case NodeType.device: return 'node';
    case NodeType.connector: return 'connector';
    case NodeType.workflow: return 'workflow engine';
    case NodeType.dashboard: return 'dashboard';
    default: return 'unknown';
  }
}

/** Online or offline, and for how long. */
export function presenceLook(node: NodeHealth, started: string, now = Date.now()): StatusLook {
  const label = node.isOnline ? 'online' : 'offline';
  const color = node.isOnline ? 'green' : 'grey';
  const icon = node.isOnline ? 'cloud_done' : 'cloud_off';
  const changes = node.history.length;
  const flaps = changes > 2 ? [`${changes} changes since the orchestrator started`] : [];
  if (node.since == null)
    return {
      label, color, icon,
      detail: [node.isOnline ? `Online since before the orchestrator started (${formatDuration(now - Date.parse(started))} ago)` : 'Not seen since the orchestrator started']
    };
  return { label, color, icon, detail: [`For ${formatDuration(now - Date.parse(node.since))}`, ...flaps] };
}

/** The configuration sync of a configured node, as the Configure page shows it. */
export function nodeSyncLook(node: NodeHealth): StatusLook | null {
  if (!node.configured || node.nodeType != NodeType.device)
    return null;
  return syncLook({
    id: node.id,
    name: node.name,
    isOnline: node.isOnline,
    syncState: node.syncState ?? undefined,
    configurationState: node.configurationState,
    lastError: node.lastError,
    failedDevices: null
  });
}

/** A device's state now. */
export function deviceLook(device: DeviceHealth): StatusLook {
  const message = device.message ? [device.message] : [];
  switch (device.state) {
    case DeviceState.running: return { label: 'running', color: 'green', icon: 'mdi-check-circle', detail: message };
    case DeviceState.error: return { label: 'error', color: 'red', icon: 'mdi-alert-circle', detail: message };
    case DeviceState.stopped: return { label: 'stopped', color: 'grey', icon: 'mdi-stop-circle-outline', detail: message };
    case DeviceState.initialized: return { label: 'initialized', color: 'blue', icon: 'mdi-dots-horizontal-circle-outline', detail: message };
    case DeviceState.unknown: return { label: 'unknown', color: 'grey', icon: 'mdi-help-circle-outline', detail: message };
    default: return { label: 'no answer', color: 'grey', icon: 'mdi-help-circle-outline', detail: ['The node did not report its devices.'] };
  }
}

/** The presence changes, newest first, as "online 08:00:00" lines. */
export function historyLines(events: PresenceEvent[]): string[] {
  return [...events].reverse().map(e => `${e.isOnline ? 'online' : 'offline'} ${new Date(e.at).toLocaleString()}`);
}

export function checkColor(status: string): string {
  switch (status) {
    case 'Healthy': return 'green';
    case 'Degraded': return 'orange';
    default: return 'red';
  }
}

/** Whether a node needs attention: offline when configured, a failed sync, or a device in error. */
export function needsAttention(node: NodeHealth): boolean {
  if (node.configured && !node.isOnline)
    return true;
  if (node.syncState == 'failed')
    return true;
  return (node.devices ?? []).some(d => d.state == DeviceState.error);
}

/** The counts at the top of the page. */
export function healthSummary(health: SystemHealth): { online: number; nodes: number; deviceErrors: number; attention: number } {
  const devices = health.nodes.flatMap(n => n.devices ?? []);
  return {
    online: health.nodes.filter(n => n.isOnline).length,
    nodes: health.nodes.length,
    deviceErrors: devices.filter(d => d.state == DeviceState.error).length,
    attention: health.nodes.filter(needsAttention).length
  };
}
