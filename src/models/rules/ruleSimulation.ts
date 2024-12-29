import type { IRule } from './IRule';
import { Rule } from './rule';
import { RuleTrigger } from './ruleTrigger';

export class RuleSimulation {

    constructor() {
        this.rule = new Rule();
    }

    simulationData: any;
    rule!: Rule;
}