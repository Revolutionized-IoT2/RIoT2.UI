import type { FailedDevice } from './generated/contracts';
import type PackageManifest from './packageManifest';

/** Whether a node runs its saved configuration (design 7.2), as the orchestrator reports it. */
export type SyncState = 'inSync' | 'pending' | 'failed' | 'legacy';

/** What the node last reported about its configuration. */
export type ConfigurationState = 'applying' | 'applied' | 'failed' | 'pendingRestart';

/**
 * A node's configuration sync (GET /api/v2/nodes/sync, design 7.2 phase 6). GET /api/nodes
 * carries the same fields, with the device states.
 */
export interface NodeSync {
    id: string;
    name?: string | null;
    isOnline: boolean;
    pluginManifest?: PackageManifest | null;
    desiredRevision?: number | null;
    appliedRevision?: number | null;
    syncState?: SyncState;
    configurationState?: ConfigurationState | null;
    lastError?: string | null;
    failedDevices?: FailedDevice[] | null;
}
