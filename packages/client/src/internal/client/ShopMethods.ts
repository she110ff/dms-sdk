import {
    ClientCore,
    Context,
    IClientHttpCore,
    LIVE_CONTRACTS,
    SupportedNetworks,
    SupportedNetworksArray
} from "../../client-common";
import { Shop, Shop__factory } from "dms-osx-lib";
import { Provider } from "@ethersproject/providers";
import { NoProviderError, NoSignerError, UnsupportedNetworkError } from "dms-sdk-common";
import { ContractUtils } from "../../utils/ContractUtils";
import {
    AddShopStepValue,
    CloseWithdrawalShopStepValue,
    NormalSteps,
    OpenWithdrawalShopStepValue,
    QueryOption,
    ShopData,
    SortByBlock,
    SortDirection,
    ShopDetailData,
    ApproveShopStepValue,
    ShopUpdateEvent,
    ShopStatusEvent,
    ShopPageType
} from "../../interfaces";
import { FailedAddShopError, FailedApprovePayment, InternalServerError, NoHttpModuleError } from "../../utils/errors";
import { Network } from "../../client-common/interfaces/network";
import { findLog } from "../../client-common/utils";

import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { ContractTransaction } from "@ethersproject/contracts";
import { getNetwork } from "@ethersproject/networks";
import { IShopMethods } from "../../interface/IShop";
import { BytesLike } from "@ethersproject/bytes";

import { QueryShopTradeHistory } from "../graphql-queries/shop/history";

/**
 * 상점의 정보를 추가/수정하는 기능과 정산의 요청/확인이 포함된 클래스이다.
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

    /**
     * 릴레이 서버가 정상적인 상태인지 검사한다.
     * @return {Promise<boolean>} 이 값이 true 이면 릴레이 서버가 정상이다.
     */
    public async isRelayUp(): Promise<boolean> {
        try {
            const res = await Network.get(await this.getEndpoint("/"));
            return res === "OK";
        } catch {
            return false;
        }
    }

    /**
     * 릴레이 서버의 주소를 이용하여 엔드포인트를 생성한다
     * @param path 경로
     * @return {Promise<URL>} 엔드포인트의 주소
     */
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

    /**
     * 상점주가 정산금에 대해서 인출가능한 금액을 제공한다.
     * @param shopId 상점의 아이디
     * @return {Promise<BigNumber>} 인출가능금액
     */
    public async getWithdrawableAmount(shopId: BytesLike): Promise<BigNumber> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), provider);
        return await shopContract.withdrawableOf(shopId);
    }

    public async isAvailableId(shopId: BytesLike): Promise<boolean> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), provider);
        return await shopContract.isAvailableId(shopId);
    }

    public async getShops(from: number, to: number): Promise<BytesLike[]> {
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

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        const account: string = await signer.getAddress();
        return await shopContract.getShopsOfAccount(account, BigNumber.from(from), BigNumber.from(to));
    }

    public async getShopsCount(): Promise<BigNumber> {
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

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        const account: string = await signer.getAddress();
        return await shopContract.getShopsCountOfAccount(account);
    }

    /**
     * 상점의 정보를 제공한다.
     * @param shopId
     * @return {Promise<ShopData>} 상점의 정보
     */
    public async getShopInfo(shopId: BytesLike): Promise<ShopData> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), provider);
        const shopInfo = await shopContract.shopOf(shopId);
        return {
            shopId: shopInfo.shopId,
            name: shopInfo.name,
            currency: shopInfo.currency,
            account: shopInfo.account,
            providedAmount: shopInfo.providedAmount,
            usedAmount: shopInfo.usedAmount,
            settledAmount: shopInfo.settledAmount,
            withdrawnAmount: shopInfo.withdrawnAmount,
            status: shopInfo.status,
            withdrawAmount: shopInfo.withdrawData.amount,
            withdrawStatus: shopInfo.withdrawData.status
        };
    }
    /**
     * 상점주가 정산금 출금 신청을 오픈한다.
     * @param shopId
     * @param amount
     * @return {AsyncGenerator<OpenWithdrawalShopStepValue>}
     */
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

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        let contractTx: ContractTransaction;
        const account: string = await signer.getAddress();
        const nonce = await shopContract.nonceOf(account);
        const signature = await ContractUtils.signShop(signer, shopId, nonce);

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

        const res = await Network.post(await this.getEndpoint("/v1/shop/withdrawal/open"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, txHash: res.data.txHash, shopId };

        const txReceipt = await contractTx.wait();

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

    /**
     * 상점주가 정산금 출금 신청을 확인하고 닫는다.
     * @param shopId
     * @return {AsyncGenerator<OpenWithdrawalShopStepValue>}
     */
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

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        const account: string = await signer.getAddress();
        let contractTx: ContractTransaction;
        const nonce = await shopContract.nonceOf(account);
        const signature = await ContractUtils.signShop(signer, shopId, nonce);

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

        const res = await Network.post(await this.getEndpoint("/v1/shop/withdrawal/close"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, txHash: res.data.txHash, shopId };

        const txReceipt = await contractTx.wait();

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

    public async getTaskDetail(taskId: BytesLike): Promise<ShopDetailData> {
        const res = await Network.get(await this.getEndpoint("/v1/shop/task"), {
            taskId: taskId.toString()
        });
        if (res.code !== 0 || res.data === undefined) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        let detail: ShopDetailData;

        try {
            detail = {
                taskId: res.data.taskId,
                shopId: res.data.shopId,
                name: res.data.name,
                currency: res.data.currency,
                status: res.data.status,
                account: res.data.account,
                taskStatus: res.taskStatus,
                timestamp: res.timestamp
            };
        } catch (_) {
            throw new InternalServerError("Error parsing receiving data");
        }

        return detail;
    }

    /**
     * 상점의 정보를 추가한다.
     * @param shopId
     * @param name
     * @param currency
     * @return {AsyncGenerator<AddShopStepValue>}
     */
    public async *add(shopId: BytesLike, name: string, currency: string): AsyncGenerator<AddShopStepValue> {
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

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        let contractTx: ContractTransaction;
        const account: string = await signer.getAddress();
        const nonce = await shopContract.nonceOf(account);
        const signature = await ContractUtils.signShop(signer, shopId, nonce);

        const param = {
            shopId,
            name,
            currency,
            account,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            shopId,
            name,
            currency,
            account,
            signature
        };

        const res = await Network.post(await this.getEndpoint("/v1/shop/add"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, shopId, name, currency, account, txHash: res.data.txHash };
        const txReceipt = await contractTx.wait();

        const log = findLog(txReceipt, shopContract.interface, "AddedShop");
        if (!log) {
            throw new FailedAddShopError();
        }
        const parsedLog = shopContract.interface.parseLog(log);

        yield {
            key: NormalSteps.DONE,
            shopId: parsedLog.args["shopId"],
            name: parsedLog.args["name"],
            currency: parsedLog.args["currency"],
            account: parsedLog.args["account"]
        };
    }

    public async *approveUpdate(
        taskId: BytesLike,
        shopId: BytesLike,
        approval: boolean
    ): AsyncGenerator<ApproveShopStepValue> {
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

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        let contractTx: ContractTransaction;
        const account: string = await signer.getAddress();
        const nonce = await shopContract.nonceOf(account);
        const signature = await ContractUtils.signShop(signer, shopId, nonce);

        const param = {
            taskId,
            approval,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            taskId,
            shopId,
            approval,
            account,
            signature
        };

        const res = await Network.post(await this.getEndpoint("/v1/shop/update/approval"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        if (approval) {
            contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

            yield { key: NormalSteps.SENT, taskId, shopId, approval, account, txHash: res.data.txHash };
            const event = await this.waitAndUpdateEvent(shopContract, contractTx);

            if (event === undefined) throw new FailedApprovePayment();
            yield {
                key: NormalSteps.APPROVED,
                taskId,
                shopId: event.shopId,
                approval,
                account: event.account,
                name: event.name,
                currency: event.currency,
                status: event.status
            };
        } else {
            yield {
                key: NormalSteps.DENIED,
                taskId,
                shopId,
                approval,
                account
            };
        }
    }

    public async *approveStatus(
        taskId: BytesLike,
        shopId: BytesLike,
        approval: boolean
    ): AsyncGenerator<ApproveShopStepValue> {
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

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        let contractTx: ContractTransaction;
        const account: string = await signer.getAddress();
        const nonce = await shopContract.nonceOf(account);
        const signature = await ContractUtils.signShop(signer, shopId, nonce);

        const param = {
            taskId,
            approval,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            taskId,
            shopId,
            approval,
            account,
            signature
        };

        let res = await Network.post(await this.getEndpoint("/v1/shop/status/approval"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        if (approval) {
            contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

            yield { key: NormalSteps.SENT, taskId, shopId, approval, account, txHash: res.data.txHash };
            const event = await this.waitAndChangeStatusEvent(shopContract, contractTx);

            if (event === undefined) throw new FailedApprovePayment();
            yield {
                key: NormalSteps.APPROVED,
                taskId,
                shopId: event.shopId,
                approval,
                account,
                status: event.status
            };
        } else {
            yield {
                key: NormalSteps.DENIED,
                taskId,
                shopId,
                approval,
                account
            };
        }
    }

    private async waitAndUpdateEvent(contract: Shop, tx: ContractTransaction): Promise<ShopUpdateEvent | undefined> {
        const contractReceipt = await tx.wait();
        const log = findLog(contractReceipt, contract.interface, "UpdatedShop");
        if (log !== undefined) {
            const parsedLog = contract.interface.parseLog(log);

            return {
                shopId: parsedLog.args.shopId,
                name: parsedLog.args.name,
                currency: parsedLog.args.currency,
                account: parsedLog.args.account,
                status: parsedLog.args.status
            };
        } else return undefined;
    }

    private async waitAndChangeStatusEvent(
        contract: Shop,
        tx: ContractTransaction
    ): Promise<ShopStatusEvent | undefined> {
        const contractReceipt = await tx.wait();
        const log = findLog(contractReceipt, contract.interface, "ChangedShopStatus");
        if (log !== undefined) {
            const parsedLog = contract.interface.parseLog(log);
            return {
                shopId: parsedLog.args.shopId,
                status: parsedLog.args.status
            };
        } else return undefined;
    }

    /**
     * 상점의 로얄티 제공/사용 거래내역을 제공한다
     * @param shopId
     * @param limit
     * @param skip
     * @param sortDirection
     * @param sortBy
     * @return {Promise<any>}
     */
    public async getProvideAndUseTradeHistory(
        shopId: BytesLike,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryShopTradeHistory;
        const where = { shopId: shopId, pageType: ShopPageType.PROVIDE_USE };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "shop trade history";
        return await this.graphql.request({ query, params, name });
    }

    /**
     상점의 거래내역들 중 정산금의 인출 거래내역을 제공한다
     * @param shopId
     * @param limit
     * @param skip
     * @param sortDirection
     * @param sortBy
     * @return {Promise<any>}
     */
    public async getWithdrawTradeHistory(
        shopId: BytesLike,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryShopTradeHistory;
        const where = { shopId: shopId, pageType: ShopPageType.WITHDRAW };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "shop trade history";
        return await this.graphql.request({ query, params, name });
    }

    public async getEstimatedProvideHistory(shopId: BytesLike): Promise<any[]> {
        const param = {
            shopId: shopId.toString()
        };

        const res = await Network.get(await this.getEndpoint("/v1/purchase/shop/provide"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data;
    }

    public async getTotalEstimatedProvideHistory(shopId: BytesLike): Promise<any[]> {
        const param = {
            shopId: shopId.toString()
        };

        const res = await Network.get(await this.getEndpoint("/v1/purchase/shop/provide/total"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data;
    }
}
