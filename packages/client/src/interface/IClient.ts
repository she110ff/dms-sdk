import { IClientCore, IClientHttpCore } from "../client-common";
import {
    DepositStepValue,
    ExchangePointToTokenOption,
    ExchangeTokenToPointOption,
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
    getPointToTokenOption: (email: string, amount: BigNumber) => Promise<ExchangePointToTokenOption>;
    getTokenToPointOption: (email: string, amount: BigNumber) => Promise<ExchangeTokenToPointOption>;
    deposit: (email: string, amount: BigNumber) => AsyncGenerator<DepositStepValue>;
    withdraw: (email: string, amount: BigNumber) => AsyncGenerator<WithdrawStepValue>;
    updateAllowance: (params: UpdateAllowanceParams) => AsyncGenerator<UpdateAllowanceStepValue>;
    getUserTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserPointInputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserTokenInputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserPointOutputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserTokenOutputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
}
