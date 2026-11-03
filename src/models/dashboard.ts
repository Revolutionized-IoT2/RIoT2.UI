import type { JsonObject, JsonValue } from './generated/contracts';
import type { ComponentSize, ComponentType } from './enums';
import type { ReportTemplate } from './reportTemplate';
import type CommandTemplate from './commandTemplate';
import type { IReport } from './report';

/**
 * The dashboard as GET /api/dashboard/configuration returns it (DashboardConfiguration): pages of
 * cards, each card showing and controlling the templates bound to its elements.
 */
export default class Dashboard {
    pages: DashboardPage[] = [];
    name: string = "";
    id: string = "";
}

export interface DashboardPage {
    id: string;
    name: string;
    icon?: string | null;
    components: DashboardCard[];
}

/**
 * One card (DashboardComponent). `kind` names its card definition in src/dashboard/cards; `type` is
 * the closest legacy type, still written for older readers. `settings` belong to the card, the
 * elements' `properties` to each element.
 */
export interface DashboardCard {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    type: ComponentType;
    size: ComponentSize;
    kind?: string | null;
    settings?: JsonObject | null;
    elements: CardElement[];
}

export type TemplateRef = { id: string, name?: string, node?: string, device?: string };

/** An element as stored: what the editors, the save and the export handle. */
export interface CardElementData {
    id: string;
    name: string;
    icon?: string | null;
    reportTemplate?: ReportTemplate | TemplateRef | null;
    commandTemplate?: CommandTemplate | TemplateRef | null;
    numberOfPreviousReports?: number;
    properties?: JsonObject | null;
    previousReports?: IReport[] | null;
    report?: IReport | null;
}

/**
 * A card element with its latest report and the history the card asked for
 * (`numberOfPreviousReports`): a new report becomes `report` and the newest history entry.
 */
export class CardElement {

    constructor(element: CardElementData) {
        this.id = element.id;
        this.name = element.name;
        this.icon = element.icon ?? undefined;
        this.reportTemplate = (element.reportTemplate as ReportTemplate | null | undefined) ?? undefined;
        this.commandTemplate = (element.commandTemplate as CommandTemplate | null | undefined) ?? undefined;
        this.properties = element.properties ?? {};
        this.numberOfPreviousReports = element.numberOfPreviousReports ?? 0;
        this._previousReports = element.previousReports ?? [];
        this._report = element.report ?? this._previousReports[0];
    }

    id: string;
    name: string;
    icon?: string;
    reportTemplate?: ReportTemplate;
    commandTemplate?: CommandTemplate;
    properties: JsonObject;
    numberOfPreviousReports: number;

    private _report: IReport | undefined;
    get report(): IReport | undefined {
        return this._report;
    }

    set report(value: IReport | undefined) {
        this._report = value;
        if (value == null || this.numberOfPreviousReports < 1)
            return;
        if (this._previousReports[0]?.timeStamp === value.timeStamp && this._previousReports[0]?.id === value.id)
            return;
        this._previousReports.unshift(value);
        if (this._previousReports.length > this.numberOfPreviousReports)
            this._previousReports.length = this.numberOfPreviousReports;
    }

    private _previousReports: IReport[];
    /** Newest first. */
    get previousReports(): IReport[] {
        return this._previousReports;
    }

    set previousReports(reports: IReport[]) {
        this._previousReports = reports ?? [];
        if (this._previousReports.length > 0)
            this._report = this._previousReports[0];
    }

    /** Oldest first, for charts. */
    get previousReportsAsc(): IReport[] {
        return this._previousReports.slice().reverse();
    }
}

/** A JSON value of an element's or card's settings. */
export type SettingValue = JsonValue;
