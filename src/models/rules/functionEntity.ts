import type { Parameter } from "./parameter";

export class FunctionEntity {
    functionId: string = "";
    name: string = "";
    data: any;
    parameters: Parameter[] = [];
}