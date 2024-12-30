import { ValueType } from './../enums';
import type { IRuleItem } from "./IRuleItem";
import { RuleType, OutputOperation } from "@/models/enums";
import type CommandTemplate from "../commandTemplate";

export class RuleOutput implements IRuleItem {

    constructor(){
        this.id = 0;
        this.name = "";
        this.description = "";
        this.ruleType = RuleType.output;
        this.commandId = "";
        this.operation = OutputOperation.write;
        this.continueFlow = true;
        this.ValueType = ValueType.Entity;
        this.dataModelMapping = "";
        this.useMapping = false;
    }

    id!: number;
    name: string;
    ruleType!: RuleType;

    commandId: string;
    description: string;
    operation!: OutputOperation;
    continueFlow!: boolean;
    dataModelMapping: any; //this can be either field name in Datamodel, or json mapping where output value is key from incoming data model<
    useMapping: boolean;

    //template
    ValueType: ValueType;
    model: any; //DatamodelMapping defines how datamodel is mapped to model

    /*
    public toJSON(): RuleOutput {
        return Object.assign({}, this, {
            $type: "RIoT2.Common.Models.RuleOutput"
        });
    }*/
}

export function useRuleOutput() {

    function create(id: number, name: string, template: CommandTemplate, operation: OutputOperation = OutputOperation.write): RuleOutput {
        let o = new RuleOutput();
        o.id = id;
        o.name = name;
        o.description = template.device +": " + template.name;
        o.commandId = template.id;
        o.operation = operation;
        o.model = template.model;
        o.ValueType = template.type;
        o.dataModelMapping = generateMappingObject(template.model); //copy model as base for mapping
        return o;
    }

    function isPrimitive(test: any) {
        return (test !== Object(test));
    }
    
    function generateMappingObject(obj: any): object {
        type dynamic = Record<string, string>;
        let retObj: dynamic = {}; 
        if(obj == null || isPrimitive(obj)) {
            retObj.value = ""
        } else {
          for (let key in obj) {
            retObj[key] = "";
          }
        }
        return retObj;
    }

    return {
        create: create
    }
}