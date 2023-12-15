// This file contains the definition of the low level network clients

import { Signer } from "@ethersproject/abstract-signer";
import { Contract, ContractInterface } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { GraphQLClient } from "graphql-request";

export interface IClientWeb3Core {
    useSigner: (signer: Signer) => void;
    shiftProvider: () => void;
    getSigner: () => Signer | null;
    getConnectedSigner: () => Signer;
    getProvider: () => JsonRpcProvider | null;
    isUp: () => Promise<boolean>;
    ensureOnline: () => Promise<void>;
    attachContract: <T>(address: string, abi: ContractInterface) => Contract & T;
    getTokenAddress: () => string;
    getLinkAddress: () => string;
    getValidatorAddress: () => string;
    getCurrencyRateAddress: () => string;
    getShopAddress: () => string;
    getLedgerAddress: () => string;
    getLoyaltyProviderAddress: () => string;
    getLoyaltyConsumerAddress: () => string;
    getLoyaltyExchangerAddress: () => string;
}

export interface IClientHttpCore {
    isRelayUp: () => Promise<boolean>;
    getEndpoint: (path: string) => Promise<URL>;
}

export interface IClientGraphQLCore {
    getClient: () => GraphQLClient;
    shiftClient: () => void;
    isUp: () => Promise<boolean>;
    ensureOnline: () => Promise<void>;
    request: <T>({
        query,
        params,
        name
    }: {
        query: string;
        params: { [key: string]: any };
        name?: string;
    }) => Promise<T>;
}

export interface IClientCore {
    web3: IClientWeb3Core;
    graphql: IClientGraphQLCore;
}
