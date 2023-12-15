// This file defines the interfaces of the context object holding client settings

import { Signer } from "@ethersproject/abstract-signer";
import { JsonRpcProvider, Networkish } from "@ethersproject/providers";
import { GraphQLClient } from "graphql-request";

// Context input parameters
type Web3ContextParams = {
    network: Networkish;
    signer?: Signer;
    web3Providers?: string | JsonRpcProvider | (string | JsonRpcProvider)[];
    phoneLinkAddress?: string;
    tokenAddress?: string;
    validatorAddress?: string;
    currencyRateAddress?: string;
    shopAddress?: string;
    ledgerAddress?: string;
    loyaltyProviderAddress?: string;
    loyaltyConsumerAddress?: string;
    loyaltyExchangerAddress?: string;
};
type HttpContextParams = {
    relayEndpoint?: string | URL;
};
type GraphQLContextParams = {
    graphqlNodes?: { url: string }[];
};

export type ContextParams = Web3ContextParams & HttpContextParams & GraphQLContextParams;

// Context state data
type Web3ContextState = {
    network: Networkish;
    signer?: Signer;
    web3Providers: JsonRpcProvider[];
    phoneLinkAddress?: string;
    tokenAddress?: string;
    validatorAddress?: string;
    currencyRateAddress?: string;
    shopAddress?: string;
    ledgerAddress?: string;
    loyaltyProviderAddress?: string;
    loyaltyConsumerAddress?: string;
    loyaltyExchangerAddress?: string;
};
type HTTPContextState = {
    relayEndpoint?: string | URL;
};
type GraphQLContextState = {
    graphql?: GraphQLClient[];
};

export type ContextState = Web3ContextState & HTTPContextState & GraphQLContextState;
