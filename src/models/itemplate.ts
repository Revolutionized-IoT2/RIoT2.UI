import type { ValueType } from './enums';
import type { JsonValue } from './generated/contracts';
import type { ValueSchema } from './valueSchema';

export interface ITemplate {
    nodeId: string;
    node: string;
    deviceId: string;
    device: string;
    id: string;
    name: string;
    type: ValueType;
    address?: string | null;
    model?: JsonValue;
    /** The value's declared schema (Core 2.2.0); see src/dashboard/sdk/capabilities.ts. */
    schema?: ValueSchema | null;
}
