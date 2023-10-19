import { IClientCore, IClientHttpCore } from "../client-common";
import { BigNumberish } from "@ethersproject/bignumber";
import {
    AddShopStepValue,
    UpdateShopStepValue,
    RemoveShopStepValue,
    OpenWithdrawalShopStepValue,
    CloseWithdrawalShopStepValue,
    ShopData
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
        providePercent: BigNumberish
    ) => AsyncGenerator<AddShopStepValue>;
    update: (
        shopId: BytesLike,
        name: string,
        provideWaitTime: BigNumberish,
        providePercent: BigNumberish
    ) => AsyncGenerator<UpdateShopStepValue>;
    remove: (shopId: BytesLike) => AsyncGenerator<RemoveShopStepValue>;
    openWithdrawal: (shopId: BytesLike, amount: BigNumberish) => AsyncGenerator<OpenWithdrawalShopStepValue>;
    closeWithdrawal: (shopId: BytesLike) => AsyncGenerator<CloseWithdrawalShopStepValue>;
    getWithdrawableAmount: (shopId: BytesLike) => Promise<BigNumberish>;
    getShopInfo: (shopId: BytesLike) => Promise<ShopData>;
}
