import { IClientCore, IClientHttpCore } from "../client-common";
import {
    DepositStepValue,
    PayPointOption,
    QueryOption,
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
    getPayPointOption: (
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: BytesLike
    ) => Promise<PayPointOption>;
    getPayTokenOption: (
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: BytesLike
    ) => Promise<PayPointOption>;
    deposit: (amount: BigNumber) => AsyncGenerator<DepositStepValue>;
    withdraw: (amount: BigNumber) => AsyncGenerator<WithdrawStepValue>;
    updateAllowance: (params: UpdateAllowanceParams) => AsyncGenerator<UpdateAllowanceStepValue>;
    getUserTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserPointInputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserTokenInputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserPointOutputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserTokenOutputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getPaidToken: (email: string, purchaseId: string, option?: QueryOption) => Promise<any>;
    getPaidPoint: (email: string, purchaseId: string, option?: QueryOption) => Promise<any>;
}
