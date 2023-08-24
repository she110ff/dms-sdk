import { IClientCore } from "../client-common";
import { BalanceOfMileageParam, BalanceOfTokenParam } from "../interfaces";
import { BigNumber } from "ethers";

export interface IClient {
    methods: IClientMethods;
}
/** Defines the shape of the general purpose Client class */
export interface IClientMethods extends IClientCore {
    getMileageBalances: (params: BalanceOfMileageParam) => Promise<BigNumber>;
    getTokenBalances: (params: BalanceOfTokenParam) => Promise<BigNumber>;
    payMileage: (params: any) => Promise<any[] | null>;
    payToken: (params: any) => Promise<any[] | null>;
    tokenToMileage: (params: any) => Promise<any[] | null>;
    mileageToToken: (params: any) => Promise<any[] | null>;
    deposit: (params: any) => Promise<any>;
    withdraw: (params: any) => Promise<any>;
}
