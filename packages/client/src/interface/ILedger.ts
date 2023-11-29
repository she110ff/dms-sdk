import { IClientCore, IClientHttpCore } from "../client-common";
import {
    ApproveCancelPaymentValue,
    ApproveNewPaymentValue,
    ChangeLoyaltyTypeStepValue,
    ChangeToPayablePointStepValue,
    DepositStepValue,
    LoyaltyType,
    PaymentDetailData,
    QueryOption,
    UpdateAllowanceParams,
    UpdateAllowanceStepValue,
    WithdrawStepValue
} from "../interfaces";
import { BigNumber } from "@ethersproject/bignumber";
import { BytesLike } from "@ethersproject/bytes";

export interface ILedger {
    ledger: ILedgerMethods;
}

/** Defines the shape of the general purpose Client class */
export interface ILedgerMethods extends IClientCore, IClientHttpCore {
    getUnPayablePointBalance: (phone: string) => Promise<BigNumber>;
    getPointBalance: (account: string) => Promise<BigNumber>;
    getTokenBalance: (account: string) => Promise<BigNumber>;

    getFeeRate: () => Promise<number>;

    getPaymentDetail: (paymentId: BytesLike) => Promise<PaymentDetailData>;

    approveNewPayment: (
        paymentId: BytesLike,
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: BytesLike,
        approval: boolean
    ) => AsyncGenerator<ApproveNewPaymentValue>;

    approveCancelPayment: (
        paymentId: BytesLike,
        purchaseId: string,
        approval: boolean
    ) => AsyncGenerator<ApproveCancelPaymentValue>;

    deposit: (amount: BigNumber) => AsyncGenerator<DepositStepValue>;
    withdraw: (amount: BigNumber) => AsyncGenerator<WithdrawStepValue>;
    updateAllowance: (params: UpdateAllowanceParams) => AsyncGenerator<UpdateAllowanceStepValue>;

    changeToLoyaltyToken: (useRelay?: boolean) => AsyncGenerator<ChangeLoyaltyTypeStepValue>;
    getLoyaltyType: (account: string) => Promise<LoyaltyType>;

    changeToPayablePoint: (phone: string, useRelay?: boolean) => AsyncGenerator<ChangeToPayablePointStepValue>;

    getSaveAndUseHistory: (account: string, option?: QueryOption) => Promise<any>;
    getDepositAndWithdrawHistory: (account: string, option?: QueryOption) => Promise<any>;

    registerMobileToken: (token: string, language: string, os: string) => Promise<void>;
}
