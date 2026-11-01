import type { JsonObject } from "@/composables/jsonValue";
import type { JsonValue } from "./generated/contracts";
import type CommandTemplate from "./commandTemplate";
import { Report } from "./report";
import { ReportTemplate } from "./reportTemplate";

export class ComponentElement implements IComponentElement {

    constructor(element: IComponentElement) {
        this.id = element.id;
        this.name = element.name;
        this.icon = element.icon;
        this.commandTemplate = element.commandTemplate;
        this.reportTemplate = element.reportTemplate;
        this.properties = element.properties;
        this.numberOfPreviousReports = element.numberOfPreviousReports != undefined ? element.numberOfPreviousReports : 0;

        this._previousReports = element.previousReports == undefined?[] : element.previousReports;
        this._report = element.report;

        if(this._report == undefined && this._previousReports.length > 0) {
            this._report = this._previousReports[0];
        }
    }

    id!: string;
    name!: string;
    icon?: string;
    reportTemplate?: ReportTemplate;
    commandTemplate?: CommandTemplate;
    properties?: ElementProperties;

    private _report: Report | undefined;
    get report(): Report | undefined {
        return (this._report != undefined) ? this._report : undefined;
    }
    
    set report(value: Report | undefined) {
        this._report = value;
        if(this.numberOfPreviousReports > 0 && value != null) {
            this._previousReports.unshift(value)
            if(this._previousReports.length > this.numberOfPreviousReports)
                this._previousReports.pop();
        }
    }
 
    private _previousReports: Report[] = [];
    get previousReports(): Report [] {
        return this._previousReports;
    }
    set previousReports(reports:  Report []) {
        this._previousReports = reports;

        if(reports != undefined && reports.length > 0)
            this._report = reports[0];
    }

    get previousReportsAsc(): Report [] {
        return this._previousReports.slice().reverse();
    }

    numberOfPreviousReports: number = 0;
}

export interface IComponentElement {
    
    id: string; //
    name: string; //
    icon?: string | undefined; //
    reportTemplate?: ReportTemplate | undefined; //
    commandTemplate?: CommandTemplate | undefined; //
    report?: Report | undefined;
    previousReports?: Report[];
    previousReportsAsc?: Report[];
    numberOfPreviousReports? : number; //
    properties?: ElementProperties; //
}

/**
 * The settings of a dashboard element, edited as JSON values: one of the classes below. A string
 * value in braces, such as "{temperature}", is read from that member of the element's entity report.
 */
export type ElementProperties = JsonObject;

export class ValueElementProperties {
    value!: string;
    unit!: string;
    useTrendIcon: boolean = false;
    digits: number = 2;
}

export class ChartElementProperties {
    value!: string;
    label!: string;
    color!: string;
}

export class ButtonElementProperties {
    // Unset until edited: the property editor shows an unset value as text.
    onValue!: JsonValue;
    offValue!: JsonValue;
    colorMapping!: JsonValue; // r g b a-> define model to send: {"red": "r"}
    
}

export class ImageElementProperties  {
    url!: string;
}

/** One state of a state element: shown while the report's numeric value is `value`. */
export type ElementState = { value: number, icon: string, color: string, name: string };

/** How a switch element shows one of its two positions. */
export type SwitchPosition = { icon: string, color: string, name: string };

export class StateElementProperties  {
    constructor() {
        this.states = [
            { value: 0, icon: 'home', color: 'red', name: 'state' }
        ]
    }
    states: ElementState[] = [];
}

export class SwitchElementProperties  {
    constructor() {
        this.off = { icon: 'error', color: 'red', name: 'off' };
        this.on = { icon: 'done', color: 'green', name: 'on' };
    }

    off: SwitchPosition;
    on: SwitchPosition;
}