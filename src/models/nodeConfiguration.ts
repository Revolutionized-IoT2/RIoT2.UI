import DeviceConfiguration from "./deviceConfiguration";

export default class NodeConfiguration {
    
	id: string | null = null;
    name: string = "";
    pluginPackageUrl: string = "";
    deviceConfigurations: DeviceConfiguration [] = [];
}