import type * as Contract from './generated/contracts';
import DeviceConfiguration from "./deviceConfiguration";

export default class NodeConfiguration implements Contract.NodeDeviceConfiguration {
    
	id: string | null = null;
    name: string = "";
    pluginPackageUrl: string = "";
    deviceConfigurations: DeviceConfiguration [] = [];
    revision?: number | null;
    hash?: string | null;
}
