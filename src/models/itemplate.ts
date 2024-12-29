import type { ValueType } from './enums';

export interface ITemplate {
    nodeId: string;
    node: string;
    deviceId: string;
    device: string;
    id: string;
    name: string;
    type: ValueType;
}