import type * as Contract from './generated/contracts';
import type { DeviceAuthorizationStatus } from './generated/contracts';
import type { DeviceState } from "./enums";

export default class DeviceStatus implements Contract.DeviceStatus {
    id!: string;
    name!: string;
    state!: DeviceState;
    message: string = "";
    /** Only for a device that signs in to a provider (Core 2.4.0). */
    authorization?: DeviceAuthorizationStatus | null;
}
