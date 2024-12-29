import type { IRuleItem } from "./IRuleItem";
import { RuleType, TriggerEvent } from "@/models/enums";
import type { ReportTemplate } from "./reportTemplate";

export class RuleTrigger implements IRuleItem {

    constructor()
    {
        this.id = 0;
        this.name = "";
        this.ruleType = RuleType.trigger;
        this.description = "";
        this.reportId = "";
        this.filter = "";
        this.filterOptions = [];
    }

    id: number;
    name: string;
    ruleType: RuleType;

    //trigger
    reportId: string;
    description: string;
    filter: string;

    //from template
    filterOptions: string[];

    /*
    public toJSON(): RuleTrigger {
        return Object.assign({}, this, {
            $type: "RIoT2.Common.Models.RuleTrigger"
        });
    }*/
}

export function useRuleTrigger() {

    function create(id: number, name: string, template: ReportTemplate): RuleTrigger {
        let t = new RuleTrigger();
        t.reportId = template.id;
        t.description = template.device +": " + template.name;  //create description based on template...
        t.name = name;
        t.id = id;
        t.filterOptions = t.filterOptions;
        return t;
    }

    return {
        create: create
    }
}