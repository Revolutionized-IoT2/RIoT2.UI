import { ValueType } from "../enums";
import type { ITemplate } from "../itemplate";

export class ReportTemplate implements ITemplate  {
    
    constructor() {
        this.type = ValueType.Text;
        this.id = "";
        this.name = "";
        this.address = "";
        this.nodeId = "";
        this.node = "";
        this.device = "";
        this.deviceId = "",
        this.filterOptions = [];
        this.parameters = {};
        this.refreshSchedule = "",
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
    filterOptions: string [] = [];
    parameters: any;
    refreshSchedule: string;
    maintainHistory: boolean;
}