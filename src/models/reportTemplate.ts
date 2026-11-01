import type * as Contract from './generated/contracts';
import type { JsonValue } from './generated/contracts';
import { ValueType } from "./enums";
import type { ITemplate } from "./itemplate";

/** A report template as the orchestrator lists it (NodeReportTemplate), or as a device declares it. */
export class ReportTemplate implements ITemplate, Contract.NodeReportTemplate {
    
    constructor() {
        this.type = ValueType.Text;
        this.id = "";
        this.name = "";
        this.address = "";
        this.nodeId = "";
        this.node = "";
        this.device = "";
        this.deviceId = "";
        this.filters = [];
        this.parameters = {};
        this.maintainHistory = false;
    }

    type!: ValueType;
    id!: string;
    name!: string;
    address!: string;
    nodeId!: string
    node!: string;
    deviceId!: string
    device!: string;
    filters: string [] = [];
    parameters: Record<string, string> | null;
    maintainHistory: boolean;
    model!: JsonValue;
}
