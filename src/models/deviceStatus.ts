import type { DeviceState } from "./enums";

export default class DeviceStatus {
    id!: string;
    name!: string;
    state!: DeviceState;
    message: string = "";
}