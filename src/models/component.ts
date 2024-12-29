import type { IComponentElement } from "./componentElement";
import type { ComponentSize, ComponentType } from "./enums";

export default class Component {
    id: string = "";
    name!: string;
    description?: string;
    icon?: string;
    type!: ComponentType; //Todo change to enum -> defines component to render
    elements: IComponentElement [] = [];
    size!: ComponentSize;
}