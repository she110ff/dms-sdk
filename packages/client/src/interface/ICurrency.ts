import { IClientCore } from "../client-common";
import { BigNumber } from "@ethersproject/bignumber";

export interface ICurrency {
    currency: ICurrencyMethods;
}

/** Defines the shape of the general purpose Client class */
export interface ICurrencyMethods extends IClientCore {
    getRate: (currency: string) => Promise<BigNumber>;
    getMultiple: () => Promise<BigNumber>;

    toPoint: (amount: BigNumber, currency?: string) => Promise<BigNumber>;
    toToken: (amount: BigNumber) => Promise<BigNumber>;
}
