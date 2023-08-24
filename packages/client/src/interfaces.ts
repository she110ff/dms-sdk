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
    relayServerURL?: string;
};

export type relayToPayMileageParam = {
    purchaseId: string;
    amount: string;
    email: string;
    franchiseeId: string;
    signer: string;
    signature: string;
};

export type BalanceOfMileageParam = {
    email: string;
};
