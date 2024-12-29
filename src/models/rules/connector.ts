export default class connector {

    constructor(from: number, to: number, down: boolean) {
        this.fromId = from;
        this.toId = to;
        this.downwards = down;
    }

    get arrowId(): string {
        return "arrow_" + this.fromIdElem + "_" + this.toIdElem;
    }

    get fromIdElem(): string {
        return "rule_" + this.fromId;
    }

    get toIdElem(): string {
        return "rule_" + this.toId;
    }

    fromId: number = -1;
    toId: number = -1;
    downwards: boolean = true;
}