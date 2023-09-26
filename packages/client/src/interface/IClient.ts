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

export interface IClient {
    methods: IClientMethods;
}

/** Defines the shape of the general purpose Client class */
export interface IClientMethods extends IClientCore, IClientHttpCore {
    getPointBalances: (email: string) => Promise<BigNumber>;
    getTokenBalances: (email: string) => Promise<BigNumber>;
    getPayPointOption: (
        purchaseId: string,
        amount: BigNumber,
        email: string,
        shopId: string
    ) => Promise<PayPointOption>;
    getPayTokenOption: (
        purchaseId: string,
        amount: BigNumber,
        email: string,
        shopId: string
    ) => Promise<PayPointOption>;
    deposit: (email: string, amount: BigNumber) => AsyncGenerator<DepositStepValue>;
    withdraw: (email: string, amount: BigNumber) => AsyncGenerator<WithdrawStepValue>;
    updateAllowance: (params: UpdateAllowanceParams) => AsyncGenerator<UpdateAllowanceStepValue>;
    getUserTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserPointInputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserTokenInputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserPointOutputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserTokenOutputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getPaidToken: (email: string, purchaseId: string, option?: QueryOption) => Promise<any>;
    getPaidPoint: (email: string, purchaseId: string, option?: QueryOption) => Promise<any>;
}
