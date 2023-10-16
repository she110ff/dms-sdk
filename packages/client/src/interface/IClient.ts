import { IClientCore, IClientHttpCore } from "../client-common";
import {
    ChangeRoyaltyTypeOption,
    ChangeRoyaltyTypeStepValue,
    DepositStepValue,
    FetchPayOption,
    PayPointOption,
    PayPointStepValue,
    PayTokenStepValue,
    QueryOption,
    RoyaltyType,
    UpdateAllowanceParams,
    UpdateAllowanceStepValue,
    WithdrawStepValue
} from "../interfaces";
import { BigNumber } from "@ethersproject/bignumber";
import { BytesLike } from "@ethersproject/bytes";

export interface IClient {
    methods: IClientMethods;
}

/** Defines the shape of the general purpose Client class */
export interface IClientMethods extends IClientCore, IClientHttpCore {
    getUnPayablePointBalance: (phone: string) => Promise<BigNumber>;
    getPointBalance: (account: string) => Promise<BigNumber>;
    getTokenBalance: (account: string) => Promise<BigNumber>;

    createOptionOfPayPoint: (
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: BytesLike
    ) => Promise<PayPointOption>;
    payPoint: (param: FetchPayOption) => AsyncGenerator<PayPointStepValue>;

    createOptionOfPayToken: (
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: BytesLike
    ) => Promise<PayPointOption>;
    payToken: (param: FetchPayOption) => AsyncGenerator<PayTokenStepValue>;

    deposit: (amount: BigNumber) => AsyncGenerator<DepositStepValue>;
    withdraw: (amount: BigNumber) => AsyncGenerator<WithdrawStepValue>;
    updateAllowance: (params: UpdateAllowanceParams) => AsyncGenerator<UpdateAllowanceStepValue>;

    createOptionOfChangeRoyaltyType: (type: RoyaltyType) => Promise<ChangeRoyaltyTypeOption>;
    changeRoyaltyType: (param: ChangeRoyaltyTypeOption) => AsyncGenerator<ChangeRoyaltyTypeStepValue>;
    getRoyaltyType: (account: string) => Promise<RoyaltyType>;

    getUserTradeHistory: (account: string, option?: QueryOption) => Promise<any>;
    getUserPointInputTradeHistory: (account: string, option?: QueryOption) => Promise<any>;
    getUserTokenInputTradeHistory: (account: string, option?: QueryOption) => Promise<any>;
    getUserPointOutputTradeHistory: (account: string, option?: QueryOption) => Promise<any>;
    getUserTokenOutputTradeHistory: (account: string, option?: QueryOption) => Promise<any>;
    getPaidToken: (account: string, purchaseId: string, option?: QueryOption) => Promise<any>;
    getPaidPoint: (account: string, purchaseId: string, option?: QueryOption) => Promise<any>;
}
