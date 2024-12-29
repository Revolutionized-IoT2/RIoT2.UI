export default class AppError {
    
    constructor(text: string, message = "", stack = "", data = "") {
        this.text = text;
        this.message = message;
        this.stack = stack;
        this.data = data;
    }

    text!: string;
    message?: string;
    stack?: string;
    data?:any;
}