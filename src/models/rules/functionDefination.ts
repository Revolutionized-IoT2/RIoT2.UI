import type { IRuleDefination } from "./IRuleDefination";
import { RuleType } from "@/models/enums";
import type { Parameter } from "./parameter";

export class FunctionDefination implements IRuleDefination {
    id: string = "";
    systemUniqueId: string = "";
    name: string = "";
    description: string = "";
    type: RuleType = RuleType.function;
    parameters: Parameter[] = [];

    //trigger defination
    functionDataModel: object = {};
}