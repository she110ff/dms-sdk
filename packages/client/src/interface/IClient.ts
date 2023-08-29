import { IClientCore } from "../client-common";
import { BalanceOfMileageParam, BalanceOfTokenParam, PayMileageOption, PayParams } from "../interfaces";
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
    tokenToMileage: (params: any) => Promise<any[] | null>;
    mileageToToken: (params: any) => Promise<any[] | null>;
    deposit: (params: any) => Promise<any>;
    withdraw: (params: any) => Promise<any>;
}
