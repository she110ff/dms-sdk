import { UnfetchResponse } from "unfetch";
import { BigNumber } from "@ethersproject/bignumber";

export class InvalidPhoneParamError extends Error {
    constructor() {
        super("The param does not phone");
    }
}

export class MismatchApproveAddressError extends Error {
    constructor() {
        super("Customer and approver mismatch");
    }
}

export class UnregisteredPhoneError extends Error {
    constructor() {
        super("Unregistered phone");
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

export class NoCurrencyRateAddress extends Error {
    constructor() {
        super("A token price address is needed");
    }
}

export class NoShopCollectionAddress extends Error {
    constructor() {
        super("A shop collection address is needed");
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

export class FailedWithdrawError extends Error {
    constructor() {
        super("Failed to withdraw");
    }
}

export class FailedPayPointError extends Error {
    constructor() {
        super("Failed to pay point");
    }
}

export class FailedPayTokenError extends Error {
    constructor() {
        super("Failed to pay token");
    }
}

export class InternalServerError extends Error {
    constructor(message: string) {
        super(`Internal Server Error. Reason : ${message}`);
    }
}

export class FailedAddShopError extends Error {
    constructor() {
        super("Failed to add shop");
    }
}
