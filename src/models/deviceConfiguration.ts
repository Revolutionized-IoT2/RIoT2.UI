import CommandTemplate from "./commandTemplate";
import { ReportTemplate } from "./rules/reportTemplate"

export default class DeviceConfiguration {

	id: string = "";
    name: string = "";
    classFullName: string = "";
    commandTemplates: CommandTemplate [] | null = null;
    reportTemplates: ReportTemplate [] | null = null;
    refreshSchedule: string = "";
    deviceParameters: any
}

