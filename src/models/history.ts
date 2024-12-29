import type Report from "./report";

export default class ReportHistory {
    id!: string;
    reports: Report [] = [];
}