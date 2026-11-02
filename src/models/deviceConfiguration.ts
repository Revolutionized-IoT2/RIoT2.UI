import type * as Contract from './generated/contracts';
import type { DeviceParameterDefinition, MatterEndpointTemplate } from './generated/contracts';
import CommandTemplate from "./commandTemplate";
import { ReportTemplate } from "./reportTemplate"

export default class DeviceConfiguration implements Contract.DeviceConfiguration {

	id: string = "";
    name: string = "";
    classFullName: string = "";
    commandTemplates: CommandTemplate [] | null = null;
    reportTemplates: ReportTemplate [] | null = null;
    refreshSchedule: string = "";
    deviceParameters: Record<string, string> | null = null;
    /** Declared by the device's plugin; the UI only passes them through. */
    matterEndpoints: MatterEndpointTemplate[] | null = null;
    hash?: string | null;
    /** Templates only: the node describes the parameters; the editor reads them, the orchestrator doesn't store them. */
    parameterDefinitions?: DeviceParameterDefinition[] | null;
}
