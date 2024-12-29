import type { IRuleDefination } from "./IRuleDefination";
import { RuleType } from "@/models/enums";

export class conditionDefination implements IRuleDefination {
    id: string = "";
    systemUniqueId: string = "";
    name: string = "";
    description: string = "";
    type: RuleType = RuleType.condition;
}