import type * as Contract from './generated/contracts';
import type { JsonValue } from './generated/contracts';
import type { ValueType } from './enums';
import type { ITemplate } from './itemplate';

/** A variable as GET /api/nodes/variable/templates lists it: in the node command template shape. */
export default class VariableTemplate implements ITemplate, Contract.NodeCommandTemplate {
    nodeId!: string;
    node!: string;
    deviceId!: string;
    device!: string;
    id!: string;
    name!: string;
    address!: string;
    model!: JsonValue;
    type!: ValueType;
}
