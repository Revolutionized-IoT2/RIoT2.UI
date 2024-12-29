import type { IRuleDefination } from "./IRuleDefination";
import { RuleType, OutputOperation } from "@/models/enums";
import type OutputParameter from "./outputParameter";

export class OutputDefination implements IRuleDefination {
    id: string = "";
    systemUniqueId: string = "";
    name: string = "";
    description: string = "";
    type: RuleType = RuleType.output;
    allowedOperations: OutputOperation[] = [];
    expectedParameters: OutputParameter[] = [];
}