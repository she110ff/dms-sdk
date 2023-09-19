import { BigNumberish } from "@ethersproject/bignumber";
import { BigNumber } from "@ethersproject/bignumber";
import { Signer } from "@ethersproject/abstract-signer";
import { JsonRpcProvider, Networkish } from "@ethersproject/providers";

export type PurchaseParam = {
    purchaseId: string;
    amount: BigNumberish;
    userEmail: string;
    franchiseeId: string;
};

export type SingPaymentParam = {
    signer: Signer;
    purchaseId: string;
    amount: BigNumberish;
    userEmail: string;
    franchiseeId: string;
    nonce: BigNumberish;
};

export type ClientParams = {
    network?: Networkish;
    signer?: Signer;
    web3Provider?: JsonRpcProvider;
    relayEndpoint?: string;
};

export type FetchPayOption = PayMileageOption | PayTokenOption;
export type PayMileageOption = {
    purchaseId: string;
    amount: string;
    email: string;
    franchiseeId: string;
    signer: string;
    signature: string;
};

export enum PayMileageSteps {
    PAYING_MILEAGE = "paying_mileage",
    DONE = "done"
}

export type PayMileageStepValue =
    | { key: PayMileageSteps.PAYING_MILEAGE; txHash: string }
    | { key: PayMileageSteps.DONE; amount: BigNumber; paidAmountMileage: BigNumber; balanceMileage: BigNumber };

export enum PayTokenSteps {
    PAYING_TOKEN = "paying_token",
    DONE = "done"
}

export type PayTokenStepValue =
    | { key: PayTokenSteps.PAYING_TOKEN; txHash: string }
    | { key: PayTokenSteps.DONE; amount: BigNumber; paidAmountToken: BigNumber; balanceToken: BigNumber };

export type PayTokenOption = {
    purchaseId: string;
    amount: string;
    email: string;
    franchiseeId: string;
    signer: string;
    signature: string;
};

export type ExchangeTokenToMileageOption = {
    email: string;
    amountToken: string;
    signer: string;
    signature: string;
};

export type ExchangeMileageToTokenOption = {
    email: string;
    amountMileage: string;
    signer: string;
    signature: string;
};

export enum DepositSteps {
    CHECKED_ALLOWANCE = "checkedAllowance",
    UPDATING_ALLOWANCE = "updatingAllowance",
    UPDATED_ALLOWANCE = "updatedAllowance",
    DEPOSITING = "depositing",
    DONE = "done"
}
export type UpdateAllowanceStepValue =
    | { key: DepositSteps.CHECKED_ALLOWANCE; allowance: BigNumber }
    | { key: DepositSteps.UPDATING_ALLOWANCE; txHash: string }
    | { key: DepositSteps.UPDATED_ALLOWANCE; allowance: BigNumber };

export type DepositStepValue =
    | UpdateAllowanceStepValue
    | { key: DepositSteps.DEPOSITING; txHash: string }
    | { key: DepositSteps.DONE; amount: BigNumber };

export type UpdateAllowanceParams = {
    targetAddress: string;
    amount: BigNumber;
    tokenAddress: string;
};

export enum WithdrawSteps {
    WITHDRAWING = "withdrawing",
    DONE = "done"
}

export type WithdrawStepValue =
    | { key: WithdrawSteps.WITHDRAWING; txHash: string }
    | { key: WithdrawSteps.DONE; amount: BigNumber };

export enum SortDirection {
    ASC = "asc",
    DESC = "desc"
}

export type QueryOption = {
    limit?: number;
    skip?: number;
    sortDirection?: SortDirection;
    sortBy?: SortByBlock;
};

export enum SortByBlock {
    BLOCK_NUMBER = "blockNumber",
    BLOCK_TIMESTAMP = "blockTimestamp"
}
export enum SortBy {
    LAST_UPDATED = "lastUpdated",
    CREATED_AT = "createdAt"
}
