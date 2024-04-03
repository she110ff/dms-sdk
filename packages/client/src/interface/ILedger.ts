import { IClientCore, IClientHttpCore } from "../client-common";
import {
    ApproveCancelPaymentValue,
    ApproveNewPaymentValue,
    ChangeLoyaltyTypeStepValue,
    ChangeToPayablePointStepValue,
    DelegatedTransferStepValue,
    DepositStepValue,
    DepositViaBridgeStepValue,
    IChainInfo,
    LoyaltyType,
    MobileType,
    PaymentDetailData,
    QueryOption,
    RemovePhoneInfoStepValue,
    UpdateAllowanceParams,
    UpdateAllowanceStepValue,
    WaiteBridgeStepValue,
    WithdrawStepValue,
    WithdrawViaBridgeStepValue
} from "../interfaces";
import { BigNumber } from "@ethersproject/bignumber";
import { BytesLike } from "@ethersproject/bytes";
import { JsonRpcProvider } from "@ethersproject/providers";

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

    changeToLoyaltyToken: () => AsyncGenerator<ChangeLoyaltyTypeStepValue>;
    getLoyaltyType: (account: string) => Promise<LoyaltyType>;

    changeToPayablePoint: (phone: string) => AsyncGenerator<ChangeToPayablePointStepValue>;

    getSaveAndUseHistory: (account: string, option?: QueryOption) => Promise<any>;
    getDepositAndWithdrawHistory: (account: string, option?: QueryOption) => Promise<any>;
    getEstimatedSaveHistory: (account: string) => Promise<any>;
    getTotalEstimatedSaveHistory: (account: string) => Promise<any>;

    registerMobileToken: (token: string, language: string, os: string, type: MobileType) => Promise<void>;

    removePhoneInfo: () => AsyncGenerator<RemovePhoneInfoStepValue>;

    getTemporaryAccount: () => Promise<string>;

    getNonceOfLedger: (account: string) => Promise<BigNumber>;

    transfer: (to: string, amount: BigNumber) => AsyncGenerator<DelegatedTransferStepValue>;

    depositViaBridge: (amount: BigNumber) => AsyncGenerator<DepositViaBridgeStepValue>;
    withdrawViaBridge: (amount: BigNumber) => AsyncGenerator<WithdrawViaBridgeStepValue>;

    waiteDepositViaBridge: (depositId: string, timeout?: number) => AsyncGenerator<WaiteBridgeStepValue>;
    waiteWithdrawViaBridge: (depositId: string, timeout?: number) => AsyncGenerator<WaiteBridgeStepValue>;

    // token
    getMainChainBalance: (account: string) => Promise<BigNumber>;
    getSideChainBalance: (account: string) => Promise<BigNumber>;
    getNonceOfMainChainToken: (account: string) => Promise<BigNumber>;
    getNonceOfSideChainToken: (account: string) => Promise<BigNumber>;

    // chain
    getChainInfoOfMainChain: () => Promise<IChainInfo>;
    getChainInfoOfSideChain: () => Promise<IChainInfo>;
    getProviderOfMainChain: () => Promise<JsonRpcProvider>;
    getProviderOfSideChain: () => Promise<JsonRpcProvider>;
}
