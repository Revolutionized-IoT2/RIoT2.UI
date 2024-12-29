import { RuleType, ConditionType, FlowOperator } from '@/models/enums';
import type { IRuleItem } from './IRuleItem';
import type { SwitchCase } from "./switchCase";

export class RuleCondition implements IRuleItem {
    id: number = 0;
    name: string = "";
    description: string = "";
    ruleType: RuleType = RuleType.condition;
    //defination!: conditionDefination; // TODO: add condition types to defination?
    //definationId: string = "-1"; //Condition 

    //condition
    //conditionInputData: object = {}; //data is received from previous step...
    conditionType: ConditionType = ConditionType.ifElse;

    //if-else params
    ifClause: string = "";
    thenOperator: FlowOperator = FlowOperator.continue;
    thenJumpTo: number = 0; 
    elseOperator: FlowOperator = FlowOperator.continue;
    elseJumpTo: number = 0;

    //switch params
    switchVariable: string = "";
    switchCases: SwitchCase[] = [];
    /*
    public toJSON(): RuleCondition {
        return Object.assign({}, this, {
            $type: "RIoT2.Common.Models.RuleCondition"
        });
    }*/
}