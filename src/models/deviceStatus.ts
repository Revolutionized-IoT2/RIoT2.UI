import type * as Contract from './generated/contracts';
import type { DeviceState } from "./enums";

export default class DeviceStatus implements Contract.DeviceStatus {
    id!: string;
    name!: string;
    state!: DeviceState;
    message: string = "";
}
