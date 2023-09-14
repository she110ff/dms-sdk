import { UnfetchResponse } from "unfetch";
import { BigNumber } from "ethers";

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

export class InsufficientBalanceError extends Error {
    constructor() {
        super("Insufficient balance error");
    }
}

export class NoHttpModuleError extends Error {
    constructor() {
        super("A Http Module is needed");
    }
}

export class ClientError extends Error {
    public response: UnfetchResponse;

    constructor(res: UnfetchResponse) {
        super(res.statusText);
        this.name = "ClientError";
        this.response = res;
    }
}

export class InvalidResponseError extends ClientError {
    constructor(res: UnfetchResponse) {
        super(res);
        this.message = "Invalid response";
    }
}

export class MissingBodyeError extends ClientError {
    constructor(res: UnfetchResponse) {
        super(res);
        this.message = "Missing response body";
    }
}

export class BodyParseError extends ClientError {
    constructor(res: UnfetchResponse) {
        super(res);
        this.message = "Error parsing body";
    }
}

export class NoTokenAddress extends Error {
    constructor() {
        super("A token address is needed");
    }
}

export class NoLinkCollectionAddress extends Error {
    constructor() {
        super("A link collection address is needed");
    }
}

export class NoValidatorCollectionAddress extends Error {
    constructor() {
        super("A validator collection address is needed");
    }
}

export class NoTokenPriceAddress extends Error {
    constructor() {
        super("A token price address is needed");
    }
}

export class NoFranchiseeCollectionAddress extends Error {
    constructor() {
        super("A franchisee collection address is needed");
    }
}

export class NoLedgerAddress extends Error {
    constructor() {
        super("A ledger address is needed");
    }
}

export class FailedDepositError extends Error {
    constructor() {
        super("Failed to deposit");
    }
}

export class AmountMismatchError extends Error {
    constructor(expected: BigNumber, received: BigNumber) {
        super(`Deposited amount mismatch. Expected: ${expected}, received: ${received}`);
    }
}
