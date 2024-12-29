import {  FlowOperator } from "@/models/enums";

export class SwitchCase {
    constructor(){
        this.case = "";
        this.operation = FlowOperator.continue;
        this.jumpTo = 0;
    }

    case!: string;
    operation!: FlowOperator;
    jumpTo!: number;
}