import type { ITemplate } from './itemplate';
import { ValueType } from './enums';

export default class CommandTemplate implements ITemplate {

    constructor() {
        this.nodeId = "";
        this.node = "";
        this.deviceId = "";
        this.device = "";
        this.id = "";
        this.name = "";
        this.address = "";
        this.model = null;
        this.type = ValueType.Text;
    }

    nodeId!: string;
    node!: string;
    deviceId!: string;
    device!: string;
    id!: string;
    name!: string;
    address!: string;
    model: any;
    type!: ValueType;
}