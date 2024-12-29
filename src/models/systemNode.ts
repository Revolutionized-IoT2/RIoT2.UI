import type DeviceStatus from "./deviceStatus";

export default class SystemNode {
    name!: string;
    id!: string;
    deviceStatuses: DeviceStatus [] = [];
    isOnline: boolean = false;
}