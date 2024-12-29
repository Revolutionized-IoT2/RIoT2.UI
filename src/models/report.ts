import { ValueElementProperties } from './componentElement';
export default class Report implements IReport {

    constructor(r: IReport) {
        this.id = r.id;
        this.timeStamp = r.timeStamp;
        this.value = r.value;
        this.filter = r.filter;
    }

    id!: string;
    timeStamp!: number;
    value: any;
    filter?: string;
}

export interface IReport {
    id: string;
    timeStamp: number;
    value: any;
    filter?: string;
}