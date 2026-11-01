import type * as Contract from './generated/contracts';
import type { JsonValue } from './generated/contracts';

/** A command the UI sends to POST /api/command/execute. */
export default class Command implements Contract.Command {
    id!: string;
    value!: JsonValue;
}
