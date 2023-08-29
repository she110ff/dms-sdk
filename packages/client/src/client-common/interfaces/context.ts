// This file defines the interfaces of the context object holding client settings

import { Signer } from "@ethersproject/abstract-signer";
import { JsonRpcProvider, Networkish } from "@ethersproject/providers";
import { Contract } from "@ethersproject/contracts";

// Context input parameters
type Web3ContextParams = {
    network: Networkish;
    signer?: Signer;
    web3Providers?: string | JsonRpcProvider | (string | JsonRpcProvider)[];
    linkCollection?: Contract;
    token?: Contract;
    validatorCollection?: Contract;
    tokenPrice?: Contract;
    franchiseeCollection?: Contract;
    ledger?: Contract;
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
    linkCollection?: Contract;
    token?: Contract;
    validatorCollection?: Contract;
    tokenPrice?: Contract;
    franchiseeCollection?: Contract;
    ledger?: Contract;
};
type HTTPContextState = {
    relayEndpoint?: string | URL;
};

export type ContextState = Web3ContextState & HTTPContextState;
export type ContextPluginState = {};
export type ContextPluginParams = ContextParams;
