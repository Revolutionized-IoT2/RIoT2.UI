export interface IRule {
    id: string;
    name: string;
    description: string;
    tags: string[];
    isActive: boolean;
    dataModel: any;
}