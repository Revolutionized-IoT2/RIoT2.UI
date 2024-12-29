import type { IRuleItem } from "./IRuleItem";
import type { IRule } from "./IRule";
import { RuleHeader } from './ruleHeader';

export class Rule implements IRule {

    constructor() { 
       
        this.ruleItems = [];
        const header = new RuleHeader();
        this.name = header.name;
        this.description = header.description; 
        this.tags = header.tags; 
        this.isActive = header.active; 
        this.dataModel = {};
    }

    public get jsonDataModel() {
        return JSON.stringify(this.dataModel);
    }

    public set jsonDataModel(value: string) {
        this.dataModel = JSON.parse(value);
    }

    id!: string;
    name: string;
    description: string;
    isActive: boolean;
    tags: string[];
    ruleItems!: IRuleItem[];
    dataModel: any;
}