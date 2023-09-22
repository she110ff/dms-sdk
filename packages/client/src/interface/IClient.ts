import { IClientCore, IClientHttpCore } from "../client-common";
import {
    DepositStepValue,
    ExchangeMileageToTokenOption,
    ExchangeTokenToMileageOption,
    PayMileageOption,
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
    getMileageBalances: (email: string) => Promise<BigNumber>;
    getTokenBalances: (email: string) => Promise<BigNumber>;
    getPayMileageOption: (
        purchaseId: string,
        amount: BigNumber,
        email: string,
        franchiseeId: string
    ) => Promise<PayMileageOption>;
    getPayTokenOption: (
        purchaseId: string,
        amount: BigNumber,
        email: string,
        franchiseeId: string
    ) => Promise<PayMileageOption>;
    getMileageToTokenOption: (email: string, amount: BigNumber) => Promise<ExchangeMileageToTokenOption>;
    getTokenToMileageOption: (email: string, amount: BigNumber) => Promise<ExchangeTokenToMileageOption>;
    deposit: (email: string, amount: BigNumber) => AsyncGenerator<DepositStepValue>;
    withdraw: (email: string, amount: BigNumber) => AsyncGenerator<WithdrawStepValue>;
    updateAllowance: (params: UpdateAllowanceParams) => AsyncGenerator<UpdateAllowanceStepValue>;
    getUserTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserMileageInputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserTokenInputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserMileageOutputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
    getUserTokenOutputTradeHistory: (email: string, option?: QueryOption) => Promise<any>;
}
