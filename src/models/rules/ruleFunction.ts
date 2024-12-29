import type { IRuleItem } from "./IRuleItem";
import { RuleType } from "@/models/enums";
import type { FunctionDefination } from "./functionDefination";
import type { Parameter } from "./parameter";
import type FunctionTemplate from "./functionTemplate";

export class RuleFunction implements IRuleItem {
    id: number = 0;
    name: string = "";
    ruleType: RuleType = RuleType.function;

    //functionInputData: object = {}; //data is received from previous step...
    functionId: string = "";
    description: string = "";
    parameters: Parameter[] = [];
    functionOutputData: object = {}; //run function with given input and parameters -> store object here
    /*
    public toJSON(): RuleFunction {
        return Object.assign({}, this, {
            $type: "RIoT2.Common.Models.RuleFunction"
        });
    }*/
}

export function useRuleFunction() {

    function create(id: number, name: string, template: FunctionTemplate): RuleFunction {
        let f = new RuleFunction();
        f.id = id;
        f.name = name;
        f.description = template.description;
        f.functionId = template.id;
        f.parameters = template.expectedParameters;
        return f;
    }

    return {
        create: create
    }
}