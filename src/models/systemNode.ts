import type DeviceStatus from "./deviceStatus";
import { NodeType } from "./enums";
import type PackageManifest from "./packageManifest";
import type { ConfigurationState, SyncState } from "./nodeSync";
import type { FailedDevice } from "./generated/contracts";

export default class SystemNode {
    name!: string;
    id!: string;
    deviceStatuses: DeviceStatus [] = [];
    isOnline: boolean = false;
    manifest: PackageManifest | null = null;
    pluginManifest: PackageManifest | null = null;
    nodeType: NodeType = NodeType.unknown;
    nodeBaseUrl: string | undefined;
    // Configuration sync (design 7.2), from GET /api/nodes and GET /api/v2/nodes/sync.
    desiredRevision?: number | null;
    appliedRevision?: number | null;
    syncState?: SyncState;
    configurationState?: ConfigurationState | null;
    lastError?: string | null;
    failedDevices?: FailedDevice[] | null;
}
