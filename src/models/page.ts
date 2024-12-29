import type Component from "./component";

export default class Page {
    id: string = "";
    name!: string;
    icon?: string;
    components: Component [] = [];
}