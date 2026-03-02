import type DeviceStatus from "./deviceStatus";
import { NodeType } from "./enums";
import type PackageManifest from "./packageManifest";

export default class SystemNode {
    name!: string;
    id!: string;
    deviceStatuses: DeviceStatus [] = [];
    isOnline: boolean = false;
    manifest: PackageManifest | null = null;
    pluginManifest: PackageManifest | null = null;
    nodeType: NodeType = NodeType.unknown;
    nodeBaseUrl: string | undefined;
}