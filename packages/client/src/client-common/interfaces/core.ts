// This file contains the definition of the low level network clients

import { Signer } from "@ethersproject/abstract-signer";
import { Contract, ContractInterface } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { FetchExchangeMileageToTokenParams, FetchExchangeTokenToMileageParams, FetchPayOption } from "../../interfaces";

export interface IClientWeb3Core {
    useSigner: (signer: Signer) => void;
    shiftProvider: () => void;
    getSigner: () => Signer | null;
    getConnectedSigner: () => Signer;
    getProvider: () => JsonRpcProvider | null;
    isUp: () => Promise<boolean>;
    ensureOnline: () => Promise<void>;
    attachContract: <T>(address: string, abi: ContractInterface) => Contract & T;
}
export interface IClientHttpCore {
    isUp: () => Promise<boolean>;
    getEndpoint: () => URL | undefined;
    fetchExchangeTokenToMileage: (params: FetchExchangeTokenToMileageParams) => Promise<any>;
    fetchExchangeMileageToTokenTo: (params: FetchExchangeMileageToTokenParams) => Promise<any>;
    fetchPayToken: (param: FetchPayOption) => Promise<any>;
    fetchPayMileage: (param: FetchPayOption) => Promise<any>;
}
export interface IClientCore {
    web3: IClientWeb3Core;
}
