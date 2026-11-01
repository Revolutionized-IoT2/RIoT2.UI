import type * as Contract from './generated/contracts';
import type { JsonValue } from './generated/contracts';

export class Report implements IReport, Contract.Report {

    constructor(r: IReport) {
        this.id = r.id;
        this.timeStamp = r.timeStamp;
        this.value = r.value;
        this.filter = r.filter;
    }

    id!: string;
    timeStamp!: number;
    value: JsonValue;
    filter?: string;
}

/** A report as the UI handles it: from MQTT or a report history, with an id and a time stamp. */
export interface IReport {
    id: string;
    timeStamp: number;
    value: JsonValue;
    filter?: string;
}
