import type { IRuleDefination } from "./IRuleDefination";
import { RuleType, TriggerEvent } from "@/models/enums";

export class TriggerDefination implements IRuleDefination {
    id: string = "";
    systemUniqueId: string = "";
    name: string = "";
    description: string = "";
    triggerEvents: TriggerEvent[] = []; // allowed trigger events for for defined trigger
    type: RuleType = RuleType.trigger;

    //trigger defination
    triggerDataModel: any;
}