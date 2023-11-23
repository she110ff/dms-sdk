import { IClientCore } from "../client-common";
import { BigNumber } from "@ethersproject/bignumber";

export interface ICurrency {
    currency: ICurrencyMethods;
}

/** Defines the shape of the general purpose Client class */
export interface ICurrencyMethods extends IClientCore {
    getRate: (currency: string) => Promise<BigNumber>;
    getMultiple: () => Promise<BigNumber>;
    getTokenSymbol: () => Promise<string>;

    pointToToken: (amount: BigNumber) => Promise<BigNumber>;
    tokenToPoint: (amount: BigNumber) => Promise<BigNumber>;

    currencyToPoint: (amount: BigNumber, symbol: string) => Promise<BigNumber>;
    pointToCurrency: (amount: BigNumber, symbol: string) => Promise<BigNumber>;

    currencyToToken: (amount: BigNumber, symbol: string) => Promise<BigNumber>;
    tokenToCurrency: (amount: BigNumber, symbol: string) => Promise<BigNumber>;
}
