import { IClientCore } from "../client-common";
import {
    BalanceOfMileageParam,
    BalanceOfTokenParam,
    ExchangeMileageToTokenParams,
    ExchangeTokenToMileageParams,
    ExchangeMileageToTokenOption,
    ExchangeTokenToMileageOption,
    PayMileageOption,
    PayParams
} from "../interfaces";
import { BigNumber } from "ethers";

export interface IClient {
    methods: IClientMethods;
}
/** Defines the shape of the general purpose Client class */
export interface IClientMethods extends IClientCore {
    getMileageBalances: (params: BalanceOfMileageParam) => Promise<BigNumber>;
    getTokenBalances: (params: BalanceOfTokenParam) => Promise<BigNumber>;
    getPayMileageOption: (params: PayParams) => Promise<PayMileageOption>;
    getPayTokenOption: (params: PayParams) => Promise<PayMileageOption>;
    getMileageToTokenOption: (params: ExchangeMileageToTokenParams) => Promise<ExchangeMileageToTokenOption>;
    getTokenToMileageOption: (params: ExchangeTokenToMileageParams) => Promise<ExchangeTokenToMileageOption>;
    deposit: (params: any) => Promise<any>;
    withdraw: (params: any) => Promise<any>;
}
