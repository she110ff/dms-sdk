import {
    ClientCore,
    Context,
    IClientHttpCore,
    LIVE_CONTRACTS,
    SupportedNetworks,
    SupportedNetworksArray
} from "../../client-common";
import { ShopCollection, ShopCollection__factory } from "dms-osx-lib";
import { Provider } from "@ethersproject/providers";
import { NoProviderError, NoSignerError, UnsupportedNetworkError } from "dms-sdk-common";
import { ContractUtils } from "../../utils/ContractUtils";
import {
    AddShopStepValue,
    CloseWithdrawalShopStepValue,
    NormalSteps,
    OpenWithdrawalShopStepValue,
    QueryOption,
    RemoveShopStepValue,
    ShopData,
    SortByBlock,
    SortDirection,
    UpdateShopStepValue
} from "../../interfaces";
import { FailedAddShopError, InternalServerError, NoHttpModuleError } from "../../utils/errors";
import { Network } from "../../client-common/interfaces/network";
import { findLog } from "../../client-common/utils";

import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { ContractTransaction } from "@ethersproject/contracts";
import { getNetwork } from "@ethersproject/networks";
import { IShopMethods } from "../../interface/IShop";
import { BytesLike } from "@ethersproject/bytes";

import { QueryShopTradeHistory } from "../graphql-queries/shop/history";

/**
 * Methods module the SDK Generic Client
 */
export class ShopMethods extends ClientCore implements IShopMethods, IClientHttpCore {
    private relayEndpoint: string | URL | undefined;

    constructor(context: Context) {
        super(context);
        if (context.relayEndpoint) {
            this.relayEndpoint = context.relayEndpoint;
        }
        Object.freeze(ShopMethods.prototype);
        Object.freeze(this);
    }

    public async isRelayUp(): Promise<boolean> {
        try {
            const res = await Network.get(await this.getEndpoint("/"));
            return res === "OK";
        } catch {
            return false;
        }
    }

    public async getEndpoint(path: string): Promise<URL> {
        if (!path) throw Error("Not path");
        let endpoint;
        if (this.relayEndpoint) {
            endpoint = this.relayEndpoint;
        } else {
            const provider = this.web3.getProvider();
            if (!provider) throw new NoProviderError();

            const network = await provider.getNetwork();
            const networkName = network.name as SupportedNetworks;
            if (!SupportedNetworksArray.includes(networkName)) {
                throw new UnsupportedNetworkError(networkName);
            }
            endpoint = LIVE_CONTRACTS[networkName].relayEndpoint;
        }

        if (!endpoint) throw new NoHttpModuleError();

        const newUrl = typeof endpoint === "string" ? new URL(endpoint) : endpoint;
        if (newUrl && !newUrl?.pathname.endsWith("/")) {
            newUrl.pathname += "/";
        }
        return new URL(path, newUrl);
    }

    public async getWithdrawableAmount(shopId: BytesLike): Promise<BigNumber> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const shopContract: ShopCollection = ShopCollection__factory.connect(
            this.web3.getShopCollectionAddress(),
            provider
        );
        return await shopContract.withdrawableOf(shopId);
    }

    public async getShopInfo(shopId: BytesLike): Promise<ShopData> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const shopContract: ShopCollection = ShopCollection__factory.connect(
            this.web3.getShopCollectionAddress(),
            provider
        );
        const shopInfo = await shopContract.shopOf(shopId);
        return {
            shopId: shopInfo.shopId,
            name: shopInfo.shopId,
            provideWaitTime: shopInfo.provideWaitTime,
            providePercent: shopInfo.providePercent,
            account: shopInfo.account,
            providedPoint: shopInfo.providedPoint,
            usedPoint: shopInfo.usedPoint,
            settledPoint: shopInfo.settledPoint,
            withdrawnPoint: shopInfo.withdrawnPoint,
            status: shopInfo.status,
            withdrawAmount: shopInfo.withdrawData.amount,
            withdrawStatus: shopInfo.withdrawData.status
        };
    }

    public async *add(
        shopId: BytesLike,
        name: string,
        provideWaitTime: BigNumberish,
        providePercent: BigNumberish
    ): AsyncGenerator<AddShopStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await signer.provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const shopContract: ShopCollection = ShopCollection__factory.connect(
            this.web3.getShopCollectionAddress(),
            signer
        );
        const account: string = await signer.getAddress();
        const nonce = await shopContract.nonceOf(account);
        const signature = await ContractUtils.signShop(signer, shopId, name, provideWaitTime, providePercent, nonce);

        const param = {
            shopId,
            name,
            provideWaitTime: provideWaitTime.toString(),
            providePercent: providePercent.toString(),
            account,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            shopId,
            name,
            provideWaitTime,
            providePercent,
            account,
            signature
        };

        const res = await Network.post(await this.getEndpoint("/shop/add"), param);
        if (res?.code !== 200) throw new InternalServerError(res.message);
        if (res?.data?.code && res.data.code !== 200) throw new InternalServerError(res?.data?.error?.message ?? "");

        yield { key: NormalSteps.SENT, txHash: res.data.txHash, shopId };

        const txResponse = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await txResponse.wait();

        const log = findLog(txReceipt, shopContract.interface, "AddedShop");
        if (!log) {
            throw new FailedAddShopError();
        }
        const parsedLog = shopContract.interface.parseLog(log);

        yield {
            key: NormalSteps.DONE,
            shopId: parsedLog.args["shopId"],
            name: parsedLog.args["name"],
            provideWaitTime: parsedLog.args["provideWaitTime"],
            providePercent: parsedLog.args["providePercent"],
            account: parsedLog.args["account"]
        };
    }

    public async *update(
        shopId: BytesLike,
        name: string,
        provideWaitTime: BigNumberish,
        providePercent: BigNumberish
    ): AsyncGenerator<UpdateShopStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await signer.provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const shopContract: ShopCollection = ShopCollection__factory.connect(
            this.web3.getShopCollectionAddress(),
            signer
        );
        const account: string = await signer.getAddress();
        const nonce = await shopContract.nonceOf(account);
        const signature = await ContractUtils.signShop(signer, shopId, name, provideWaitTime, providePercent, nonce);

        const param = {
            shopId,
            name,
            provideWaitTime: provideWaitTime.toString(),
            providePercent: providePercent.toString(),
            account,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            shopId,
            name,
            provideWaitTime,
            providePercent,
            account,
            signature
        };

        const res = await Network.post(await this.getEndpoint("/shop/update"), param);
        if (res?.code !== 200) throw new InternalServerError(res.message);
        if (res?.data?.code && res.data.code !== 200) throw new InternalServerError(res?.data?.error?.message ?? "");

        yield { key: NormalSteps.SENT, txHash: res.data.txHash, shopId };

        const txResponse = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await txResponse.wait();

        const log = findLog(txReceipt, shopContract.interface, "UpdatedShop");
        if (!log) {
            throw new FailedAddShopError();
        }
        const parsedLog = shopContract.interface.parseLog(log);

        yield {
            key: NormalSteps.DONE,
            shopId: parsedLog.args["shopId"],
            name: parsedLog.args["name"],
            provideWaitTime: parsedLog.args["provideWaitTime"],
            providePercent: parsedLog.args["providePercent"],
            account: parsedLog.args["account"]
        };
    }

    public async *remove(shopId: BytesLike): AsyncGenerator<RemoveShopStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await signer.provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const shopContract: ShopCollection = ShopCollection__factory.connect(
            this.web3.getShopCollectionAddress(),
            signer
        );
        const account: string = await signer.getAddress();
        const nonce = await shopContract.nonceOf(account);
        const signature = await ContractUtils.signShopId(signer, shopId, nonce);

        const param = {
            shopId,
            account,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            shopId,
            account,
            signature
        };

        const res = await Network.post(await this.getEndpoint("/shop/remove"), param);
        if (res?.code !== 200) throw new InternalServerError(res.message);
        if (res?.data?.code && res.data.code !== 200) throw new InternalServerError(res?.data?.error?.message ?? "");

        yield { key: NormalSteps.SENT, txHash: res.data.txHash, shopId };

        const txResponse = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await txResponse.wait();

        const log = findLog(txReceipt, shopContract.interface, "RemovedShop");
        if (!log) {
            throw new FailedAddShopError();
        }
        const parsedLog = shopContract.interface.parseLog(log);

        yield {
            key: NormalSteps.DONE,
            shopId: parsedLog.args["shopId"]
        };
    }

    public async *openWithdrawal(shopId: BytesLike, amount: BigNumberish): AsyncGenerator<OpenWithdrawalShopStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await signer.provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const shopContract: ShopCollection = ShopCollection__factory.connect(
            this.web3.getShopCollectionAddress(),
            signer
        );
        const account: string = await signer.getAddress();
        const nonce = await shopContract.nonceOf(account);
        const signature = await ContractUtils.signShopId(signer, shopId, nonce);

        const param = {
            shopId,
            account,
            amount: amount.toString(),
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            shopId,
            account,
            amount,
            signature
        };

        const res = await Network.post(await this.getEndpoint("/shop/openWithdrawal"), param);
        if (res?.code !== 200) throw new InternalServerError(res.message);
        if (res?.data?.code && res.data.code !== 200) throw new InternalServerError(res?.data?.error?.message ?? "");

        yield { key: NormalSteps.SENT, txHash: res.data.txHash, shopId };

        const txResponse = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await txResponse.wait();

        const log = findLog(txReceipt, shopContract.interface, "OpenedWithdrawal");
        if (!log) {
            throw new FailedAddShopError();
        }
        const parsedLog = shopContract.interface.parseLog(log);

        yield {
            key: NormalSteps.DONE,
            shopId: parsedLog.args["shopId"],
            amount: parsedLog.args["amount"],
            account: parsedLog.args["account"]
        };
    }

    public async *closeWithdrawal(shopId: BytesLike): AsyncGenerator<CloseWithdrawalShopStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await signer.provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const shopContract: ShopCollection = ShopCollection__factory.connect(
            this.web3.getShopCollectionAddress(),
            signer
        );
        const account: string = await signer.getAddress();
        const nonce = await shopContract.nonceOf(account);
        const signature = await ContractUtils.signShopId(signer, shopId, nonce);

        const param = {
            shopId,
            account,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            shopId,
            account,
            signature
        };

        const res = await Network.post(await this.getEndpoint("/shop/closeWithdrawal"), param);
        if (res?.code !== 200) throw new InternalServerError(res.message);
        if (res?.data?.code && res.data.code !== 200) throw new InternalServerError(res?.data?.error?.message ?? "");

        yield { key: NormalSteps.SENT, txHash: res.data.txHash, shopId };

        const txResponse = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await txResponse.wait();

        const log = findLog(txReceipt, shopContract.interface, "ClosedWithdrawal");
        if (!log) {
            throw new FailedAddShopError();
        }
        const parsedLog = shopContract.interface.parseLog(log);

        yield {
            key: NormalSteps.DONE,
            shopId: parsedLog.args["shopId"],
            amount: parsedLog.args["amount"],
            account: parsedLog.args["account"]
        };
    }
    public async getShopTradeHistory(
        shopId: BytesLike,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryShopTradeHistory;
        const where = { shopId: shopId };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        const res = await this.graphql.request({ query, params, name });
        return res;
    }

    public async getShopProvidedTradeHistory(
        shopId: BytesLike,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryShopTradeHistory;
        const where = { shopId: shopId, action: "ProvidedPoint" };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "shop trade history";
        const res = await this.graphql.request({ query, params, name });
        return res;
    }

    public async getShopUsedTradeHistory(
        shopId: BytesLike,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryShopTradeHistory;
        const where = { shopId: shopId, action: "UsedPoint" };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "shop trade history";
        const res = await this.graphql.request({ query, params, name });
        return res;
    }

    public async getShopOpenWithdrawnTradeHistory(
        shopId: BytesLike,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryShopTradeHistory;
        const where = { shopId: shopId, action: "OpenWithdrawnPoint" };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "shop trade history";
        const res = await this.graphql.request({ query, params, name });
        return res;
    }

    public async getShopCloseWithdrawnTradeHistory(
        shopId: BytesLike,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryShopTradeHistory;
        const where = { shopId: shopId, action: "CloseWithdrawnPoint" };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "shop trade history";
        const res = await this.graphql.request({ query, params, name });
        return res;
    }
}
