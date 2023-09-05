export class InvalidEmailParamError extends Error {
    constructor() {
        super("The param does not email");
    }
}

export class MismatchApproveAddressError extends Error {
    constructor() {
        super("Customer and approver mismatch");
    }
}

export class UnregisteredEmailError extends Error {
    constructor() {
        super("Unregistered email error");
    }
}

export class NoHttpModuleError extends Error {
    constructor() {
        super("A Http Module is needed");
    }
}
export class ClientError extends Error {
    public response: Response;
    constructor(res: Response) {
        super(res.statusText);
        this.name = "ClientError";
        this.response = res;
    }
}

export class InvalidResponseError extends ClientError {
    constructor(res: Response) {
        super(res);
        this.message = "Invalid response";
    }
}
export class MissingBodyeError extends ClientError {
    constructor(res: Response) {
        super(res);
        this.message = "Missing response body";
    }
}
export class BodyParseError extends ClientError {
    constructor(res: Response) {
        super(res);
        this.message = "Error parsing body";
    }
}
