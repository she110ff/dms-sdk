import { UnfetchResponse } from "unfetch";
import { BigNumber } from "@ethersproject/bignumber";

export class NetworkError extends Error {
    public status: number;
    public statusText: string;
    constructor(status: number, statusText: string) {
        super(statusText);
        this.name = "NetworkError";
        this.status = status;
        this.statusText = statusText;
    }
}

export class NotFoundError extends NetworkError {
    constructor(status: number, statusText: string) {
        super(status, statusText);
        this.name = "NotFoundError";
    }
}

export class BadRequestError extends NetworkError {
    constructor(status: number, statusText: string) {
        super(status, statusText);
        this.name = "BadRequestError";
    }
}

export class InvalidPhoneParamError extends Error {
    constructor() {
        super("The param does not phone");
    }
}

export class MismatchedAddressError extends Error {
    constructor() {
        super("The wallet address associated with the phone number has a different signer");
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

export class NoLoyaltyProviderAddress extends Error {
    constructor() {
        super("A loyalty provider address is needed");
    }
}

export class NoLoyaltyConsumerAddress extends Error {
    constructor() {
        super("A loyalty consumer address is needed");
    }
}

export class NoLoyaltyExchangerAddress extends Error {
    constructor() {
        super("A loyalty exchanger address is needed");
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
        super(`Internal Server Error. Reason: ${message}`);
    }
}

export class FailedAddShopError extends Error {
    constructor() {
        super("Failed to add shop");
    }
}

export class NoValidator extends Error {
    constructor() {
        super("Validators not found");
    }
}

export class FailedApprovePayment extends Error {
    constructor() {
        super("Failed to approve new payment ");
    }
}

export class FailedRemovePhoneInfoError extends Error {
    constructor() {
        super("Failed to remove phone information");
    }
}
