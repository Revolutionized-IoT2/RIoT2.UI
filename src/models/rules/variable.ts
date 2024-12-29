import type { ValueType } from './../enums';

export class Variable {

    id!: string;
    name!: string;
    description!: string;
    isPersistant: boolean = true;
    type!: ValueType;
    value: any; 
}
