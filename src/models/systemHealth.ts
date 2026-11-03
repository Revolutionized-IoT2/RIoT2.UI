import type { OutboxSummary } from './commandDelivery';
import type { DeviceState, NodeType } from './enums';
import type { ConfigurationState, SyncState } from './nodeSync';

/** A node going online or offline, as the orchestrator saw it. */
export interface PresenceEvent {
  at: string;
  isOnline: boolean;
}

/** A device of a configured node: its state now and the last error the orchestrator saw. */
export interface DeviceHealth {
  id: string;
  name?: string | null;
  /** Null when the node didn't answer. */
  state?: DeviceState | null;
  message?: string | null;
  lastError?: string | null;
  lastErrorAt?: string | null;
}

/** A node, connector or workflow engine on the System page. */
export interface NodeHealth {
  id: string;
  name?: string | null;
  nodeType: NodeType;
  configured: boolean;
  isOnline: boolean;
  /** When its current state began; null when it hasn't changed since the orchestrator started. */
  since?: string | null;
  version?: string | null;
  pluginVersion?: string | null;
  syncState?: SyncState | null;
  configurationState?: ConfigurationState | null;
  lastError?: string | null;
  /** Presence changes since the orchestrator started, oldest first. */
  history: PresenceEvent[];
  /** Configured device nodes only. */
  devices?: DeviceHealth[] | null;
  /** The node didn't report its device states (offline, or no answer within 5 s). */
  devicesUnavailable: boolean;
}

export interface HealthCheckEntry {
  name: string;
  status: string;
  description?: string | null;
}

/** GET /api/v2/system/health (Orchestrator 1.20.0, I46). */
export interface SystemHealth {
  generatedAt: string;
  orchestrator: {
    version?: string | null;
    started: string;
    /** Healthy, Degraded or Unhealthy: the worst check. */
    status: string;
    checks: HealthCheckEntry[];
  };
  outbox: OutboxSummary;
  nodes: NodeHealth[];
}
