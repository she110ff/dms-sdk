import { IClientCore, IClientHttpCore } from "../client-common";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import {
    AddShopStepValue,
    UpdateShopStepValue,
    RemoveShopStepValue,
    OpenWithdrawalShopStepValue,
    CloseWithdrawalShopStepValue,
    ShopData,
    QueryOption
} from "../interfaces";
import { BytesLike } from "@ethersproject/bytes";

export interface IShop {
    shop: IShopMethods;
}

/** Defines the shape of the general purpose Client class */
export interface IShopMethods extends IClientCore, IClientHttpCore {
    add: (
        shopId: BytesLike,
        name: string,
        provideWaitTime: BigNumberish,
        providePercent: BigNumberish,
        useRelay?: boolean
    ) => AsyncGenerator<AddShopStepValue>;
    update: (
        shopId: BytesLike,
        name: string,
        provideWaitTime: BigNumberish,
        providePercent: BigNumberish,
        useRelay?: boolean
    ) => AsyncGenerator<UpdateShopStepValue>;
    remove: (shopId: BytesLike, useRelay?: boolean) => AsyncGenerator<RemoveShopStepValue>;
    openWithdrawal: (
        shopId: BytesLike,
        amount: BigNumberish,
        useRelay?: boolean
    ) => AsyncGenerator<OpenWithdrawalShopStepValue>;
    closeWithdrawal: (shopId: BytesLike, useRelay?: boolean) => AsyncGenerator<CloseWithdrawalShopStepValue>;
    getWithdrawableAmount: (shopId: BytesLike) => Promise<BigNumber>;
    getShopInfo: (shopId: BytesLike) => Promise<ShopData>;

    getShopTradeHistory: (shopId: BytesLike, option?: QueryOption) => Promise<any>;
    getShopProvidedTradeHistory: (shopId: BytesLike, option?: QueryOption) => Promise<any>;
    getShopUsedTradeHistory: (shopId: BytesLike, option?: QueryOption) => Promise<any>;
    getShopOpenWithdrawnTradeHistory: (shopId: BytesLike, option?: QueryOption) => Promise<any>;
    getShopCloseWithdrawnTradeHistory: (shopId: BytesLike, option?: QueryOption) => Promise<any>;
}
