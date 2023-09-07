import { IClientCore } from "../client-common";
import { ExchangeMileageToTokenOption, ExchangeTokenToMileageOption, PayMileageOption } from "../interfaces";
import { BigNumber, ContractTransaction } from "ethers";

export interface IClient {
    methods: IClientMethods;
}
/** Defines the shape of the general purpose Client class */
export interface IClientMethods extends IClientCore {
    getMileageBalances: (email: string) => Promise<BigNumber>;
    getTokenBalances: (email: string) => Promise<BigNumber>;
    getPayMileageOption: (
        purchaseId: string,
        amount: number,
        email: string,
        franchiseeId: string
    ) => Promise<PayMileageOption>;
    getPayTokenOption: (
        purchaseId: string,
        amount: number,
        email: string,
        franchiseeId: string
    ) => Promise<PayMileageOption>;
    getMileageToTokenOption: (email: string, amount: number) => Promise<ExchangeMileageToTokenOption>;
    getTokenToMileageOption: (email: string, amount: number) => Promise<ExchangeTokenToMileageOption>;
    deposit: (email: string, amount: number) => Promise<ContractTransaction[]>;
    withdraw: (email: string, amount: number) => Promise<ContractTransaction>;
}
