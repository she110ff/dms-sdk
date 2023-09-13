// This file defines the interfaces of the context object holding client settings

import { Signer } from "@ethersproject/abstract-signer";
import { JsonRpcProvider, Networkish } from "@ethersproject/providers";

// Context input parameters
type Web3ContextParams = {
    network: Networkish;
    signer?: Signer;
    web3Providers?: string | JsonRpcProvider | (string | JsonRpcProvider)[];
    linkCollectionAddress?: string;
    tokenAddress?: string;
    validatorCollectionAddress?: string;
    tokenPriceAddress?: string;
    franchiseeCollectionAddress?: string;
    ledgerAddress?: string;
};
type HttpContextParams = {
    relayEndpoint?: string | URL;
};
export type ContextParams = Web3ContextParams & HttpContextParams;

// Context state data
type Web3ContextState = {
    network: Networkish;
    signer?: Signer;
    web3Providers: JsonRpcProvider[];
    linkCollectionAddress?: string;
    tokenAddress?: string;
    validatorCollectionAddress?: string;
    tokenPriceAddress?: string;
    franchiseeCollectionAddress?: string;
    ledgerAddress?: string;
};
type HTTPContextState = {
    relayEndpoint?: string | URL;
};

export type ContextState = Web3ContextState & HTTPContextState;
