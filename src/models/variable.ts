import type { JsonValue } from './generated/contracts';
import type { ValueType } from './enums';

/** A variable as the orchestrator's /api/v2/variables serves it (its VariableDTO, not a Core contract). */
export class Variable {

    id!: string;
    name!: string;
    description!: string;
    isPersistant: boolean = true;
    type!: ValueType;
    value!: JsonValue;
}
