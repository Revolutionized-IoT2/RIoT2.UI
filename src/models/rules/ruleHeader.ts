export class RuleHeader {

    constructor() {
        this.active = false;
        this.tags = [];
        this.name = "new rule";
        this.description = "description of new rule";
    }

    name!: string;
    description!: string;
    tags!: string[];
    active!: boolean;
}