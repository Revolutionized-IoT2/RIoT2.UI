import type { Parameter } from "./parameter";

export default class FunctionTemplate {
    id!: string;
    name!: string;
    expectedParameters!: Parameter [];
    description!: string;
}