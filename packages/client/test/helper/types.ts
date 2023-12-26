import { Wallet } from "@ethersproject/wallet";

export interface IPurchaseData {
    purchaseId: string;
    timestamp: number;
    amount: number;
    method: number;
    currency: string;
    userIndex: number;
    shopIndex: number;
}

export interface IShopData {
    shopId: string;
    name: string;
    currency: string;
    wallet: Wallet;
}

export interface IUserData {
    phone: string;
    address: string;
    privateKey: string;
}

export enum ContractShopStatus {
    INVALID,
    ACTIVE,
    INACTIVE
}
