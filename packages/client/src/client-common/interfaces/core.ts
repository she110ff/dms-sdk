// This file contains the definition of the low level network clients

import { Signer } from "@ethersproject/abstract-signer";
import { Contract, ContractInterface } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { ExchangeMileageToTokenOption, ExchangeTokenToMileageOption, FetchPayOption } from "../../interfaces";

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
    getLinkCollectionAddress: () => string;
    getValidatorCollectionAddress: () => string;
    getTokenPriceAddress: () => string;
    getFranchiseeCollectionAddress: () => string;
    getLedgerAddress: () => string;
}

export interface IClientHttpCore {
    isRelayUp: () => Promise<boolean>;
    getEndpoint: (path: string) => Promise<URL>;
    fetchExchangeTokenToMileage: (params: ExchangeTokenToMileageOption) => Promise<any>;
    fetchExchangeMileageToToken: (params: ExchangeMileageToTokenOption) => Promise<any>;
    fetchPayToken: (param: FetchPayOption) => Promise<any>;
    fetchPayMileage: (param: FetchPayOption) => Promise<any>;
}

export interface IClientCore {
    web3: IClientWeb3Core;
}
