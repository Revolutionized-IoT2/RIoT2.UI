import type * as Contract from './generated/contracts';
import type { JsonValue } from './generated/contracts';
import type { ITemplate } from './itemplate';
import { ValueType } from './enums';

/** A command template as the orchestrator lists it (NodeCommandTemplate), or as a device declares it. */
export default class CommandTemplate implements ITemplate, Contract.NodeCommandTemplate {

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
    model: JsonValue;
    type!: ValueType;
}
