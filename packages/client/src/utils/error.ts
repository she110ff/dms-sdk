export class InvalidEmailParamError extends Error {
    constructor() {
        super("The param does not email");
    }
}
