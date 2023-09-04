import { BigNumberish } from "@ethersproject/bignumber";
import { Signer } from "ethers";
import { JsonRpcProvider, Networkish } from "@ethersproject/providers";

export type PurchaseParam = {
    purchaseId: string;
    amount: BigNumberish;
    userEmail: string;
    franchiseeId: string;
};

export type SingPaymentParam = {
    signer: Signer;
    purchaseId: string;
    amount: BigNumberish;
    userEmail: string;
    franchiseeId: string;
    nonce: BigNumberish;
};

export type ClientParams = {
    network?: Networkish;
    signer?: Signer;
    web3Provider?: JsonRpcProvider;
    relayEndpoint?: string;
};

export type relayToPayMileageParam = {
    purchaseId: string;
    amount: string;
    email: string;
    franchiseeId: string;
    signer: string;
    signature: string;
};

export type BalanceParam = BalanceOfMileageParam | BalanceOfTokenParam;
export type BalanceOfMileageParam = {
    email: string;
};
export type BalanceOfTokenParam = {
    email: string;
};

export type PayParams = PayMileageParams | PayTokenParams;
export type PayMileageParams = {
    signer: Signer;
    purchaseId: string;
    purchaseAmount: number;
    email: string;
    franchiseeId: string;
};
export type PayTokenParams = {
    signer: Signer;
    purchaseId: string;
    purchaseAmount: number;
    email: string;
    franchiseeId: string;
};

export type FetchPayOption = PayMileageOption | PayTokenOption;
export type PayMileageOption = {
    purchaseId: string;
    amount: string;
    email: string;
    franchiseeId: string;
    signer: string;
    signature: string;
};

export type PayTokenOption = {
    purchaseId: string;
    amount: string;
    email: string;
    franchiseeId: string;
    signer: string;
    signature: string;
};

export type ExchangeParams = ExchangeTokenToMileageParams | ExchangeMileageToTokenParams;
export type ExchangeTokenToMileageParams = {
    signer: Signer;
    email: string;
    amount: number;
};
export type ExchangeMileageToTokenParams = {
    signer: Signer;
    email: string;
    amount: number;
};

export type ExchangeTokenToMileageOption = {
    email: string;
    amountToken: string;
    signer: string;
    signature: string;
};

export type ExchangeMileageToTokenOption = {
    email: string;
    amountMileage: string;
    signer: string;
    signature: string;
};
