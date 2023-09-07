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
    deposit: (email: string, amount: BigNumber) => Promise<ContractTransaction[]>;
    withdraw: (email: string, amount: BigNumber) => Promise<ContractTransaction>;
}
