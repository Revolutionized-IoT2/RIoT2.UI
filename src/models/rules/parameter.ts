import { ValueType } from "@/models/enums";

export class Parameter {
    isOptional: boolean = false;
    name: string = "";
    value: any = null;
    type: ValueType = ValueType.Text;
    description?: string;
    //TODO add validation later. this is Regexp field validation
    //validation: string;
}