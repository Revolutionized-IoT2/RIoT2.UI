import type { ValueType } from './enums';
import type { ITemplate } from './itemplate';

export default class VariableTemplate implements ITemplate {
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