import { IClientCore, IClientHttpCore } from "../client-common";
import {
    ChangeRoyaltyTypeStepValue,
    DepositStepValue,
    PayPointStepValue,
    PayTokenStepValue,
    QueryOption,
    RoyaltyType,
    UpdateAllowanceParams,
    UpdateAllowanceStepValue,
    WithdrawStepValue,
    ChangeToPayablePointStepValue
} from "../interfaces";
import { BigNumber } from "@ethersproject/bignumber";

export interface ILedger {
    ledger: ILedgerMethods;
}

/** Defines the shape of the general purpose Client class */
export interface ILedgerMethods extends IClientCore, IClientHttpCore {
    getUnPayablePointBalance: (phone: string) => Promise<BigNumber>;
    getPointBalance: (account: string) => Promise<BigNumber>;
    getTokenBalance: (account: string) => Promise<BigNumber>;

    getFeeRate: () => Promise<number>;

    payPoint: (
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: string
    ) => AsyncGenerator<PayPointStepValue>;

    payToken: (
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: string
    ) => AsyncGenerator<PayTokenStepValue>;

    deposit: (amount: BigNumber) => AsyncGenerator<DepositStepValue>;
    withdraw: (amount: BigNumber) => AsyncGenerator<WithdrawStepValue>;
    updateAllowance: (params: UpdateAllowanceParams) => AsyncGenerator<UpdateAllowanceStepValue>;

    changeRoyaltyType: (type: RoyaltyType) => AsyncGenerator<ChangeRoyaltyTypeStepValue>;
    getRoyaltyType: (account: string) => Promise<RoyaltyType>;

    changeToPayablePoint: (phone: string) => AsyncGenerator<ChangeToPayablePointStepValue>;

    getUserTradeHistory: (account: string, option?: QueryOption) => Promise<any>;
    getUserPointInputTradeHistory: (account: string, option?: QueryOption) => Promise<any>;
    getUserTokenInputTradeHistory: (account: string, option?: QueryOption) => Promise<any>;
    getUserPointOutputTradeHistory: (account: string, option?: QueryOption) => Promise<any>;
    getUserTokenOutputTradeHistory: (account: string, option?: QueryOption) => Promise<any>;
    getPaidToken: (account: string, purchaseId: string, option?: QueryOption) => Promise<any>;
    getPaidPoint: (account: string, purchaseId: string, option?: QueryOption) => Promise<any>;
}
