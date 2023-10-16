import {
    ClientCore,
    Context,
    IClientHttpCore,
    LIVE_CONTRACTS,
    SupportedNetworks,
    SupportedNetworksArray
} from "../../client-common";
import { IClientMethods } from "../../interface/IClient";
import { Ledger, Ledger__factory, Token, Token__factory } from "dms-osx-lib";
import { Provider } from "@ethersproject/providers";
import { NoProviderError, NoSignerError, UnsupportedNetworkError, UpdateAllowanceError } from "dms-sdk-common";
import { ContractUtils } from "../../utils/ContractUtils";
import {
    ChangeRoyaltyTypeOption,
    ChangeRoyaltyTypeSteps,
    ChangeRoyaltyTypeStepValue,
    DepositSteps,
    DepositStepValue,
    FetchPayOption,
    PayPointOption,
    PayPointSteps,
    PayPointStepValue,
    PayTokenOption,
    PayTokenSteps,
    PayTokenStepValue,
    QueryOption,
    RoyaltyType,
    SortByBlock,
    SortDirection,
    UpdateAllowanceParams,
    UpdateAllowanceStepValue,
    WithdrawSteps,
    WithdrawStepValue
} from "../../interfaces";
import {
    AmountMismatchError,
    FailedDepositError,
    FailedPayPointError,
    FailedPayTokenError,
    FailedWithdrawError,
    InsufficientBalanceError,
    InternalServerError,
    NoHttpModuleError,
    RoyaltyTypeMismatchError
} from "../../utils/errors";
import { Network } from "../../client-common/interfaces/network";
import { findLog } from "../../client-common/utils";

import { BigNumber } from "@ethersproject/bignumber";
import { ContractTransaction } from "@ethersproject/contracts";
import { getNetwork } from "@ethersproject/networks";
import { QueryUserTradeHistory } from "../graphql-queries/history";
import { QueryPaidToken } from "../graphql-queries/paidToken";
import { QueryPaidPoint } from "../graphql-queries/paidPoint";
import { BytesLike } from "@ethersproject/bytes";

/**
 * Methods module the SDK Generic Client
 */
export class ClientMethods extends ClientCore implements IClientMethods, IClientHttpCore {
    private relayEndpoint: string | URL | undefined;

    constructor(context: Context) {
        super(context);
        if (context.relayEndpoint) {
            this.relayEndpoint = context.relayEndpoint;
        }
        Object.freeze(ClientMethods.prototype);
        Object.freeze(this);
    }

    /**
     * 포인트의 잔고를 리턴한다
     * @param {string} phone - 전화번호 해시
     * @return {Promise<BigNumber>} 포인트 잔고
     */
    public async getUnPayablePointBalance(phone: string): Promise<BigNumber> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);
        return await ledgerInstance.unPayablePointBalanceOf(phone);
    }

    /**
     * 포인트의 잔고를 리턴한다
     * @param {string} account - 지갑 주소
     * @return {Promise<BigNumber>} 포인트 잔고
     */
    public async getPointBalance(account: string): Promise<BigNumber> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);
        return await ledgerInstance.pointBalanceOf(account);
    }

    /**
     * 토큰의 잔고를 리턴한다.
     * @param {string} account - 지갑 주소
     * @return {Promise<BigNumber>} 토큰 잔고
     */
    public async getTokenBalance(account: string): Promise<BigNumber> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);

        return await ledgerInstance.tokenBalanceOf(account);
    }

    /**
     * 포인트 사용승인 하여 Relay 서버로 전송하기 위한 서명값을 생성한다.
     * @param purchaseId - 거래 아이디
     * @param amount - 거래금액
     * @param currency - 통화코드
     * @param shopId - 상점 아이디
     * @return {Promise<PayPointOption>}
     */
    public async createOptionOfPayPoint(
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: BytesLike
    ): Promise<PayPointOption> {
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

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const account: string = await signer.getAddress();

        const nonce = await ledgerContract.nonceOf(account);
        const signature = await ContractUtils.signPayment(signer, purchaseId, amount, currency, shopId, nonce);

        const relayParam: FetchPayOption = {
            purchaseId,
            amount: amount.toString(),
            currency,
            shopId,
            account,
            signature
        };
        return Promise.resolve(relayParam);
    }

    /**
     * 토큰 사용승인 하여 Relay 서버로 전송하기 위한 서명값을 생성한다.
     * @param purchaseId - 거래 아이디
     * @param amount - 거래금액
     * @param currency - 통화코드
     * @param shopId - 상점 아이디
     * @return {Promise<PayTokenOption>}
     */
    public async createOptionOfPayToken(
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: BytesLike
    ): Promise<PayTokenOption> {
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

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const account: string = await signer.getAddress();

        const nonce = await ledgerContract.nonceOf(account);
        const signature = await ContractUtils.signPayment(signer, purchaseId, amount, currency, shopId, nonce);

        const relayParam: FetchPayOption = {
            purchaseId,
            amount: amount.toString(),
            currency,
            shopId,
            account,
            signature
        };
        return Promise.resolve(relayParam);
    }

    /**
     * 토큰을 예치합니다.
     * @param {BigNumber} amount 금액
     * @return {AsyncGenerator<DepositStepValue>}
     */
    public async *deposit(amount: BigNumber): AsyncGenerator<DepositStepValue> {
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

        const account: string = await signer.getAddress();

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const tokenContract: Token = Token__factory.connect(this.web3.getTokenAddress(), signer);

        const balance = await tokenContract.balanceOf(account);
        if (amount.gte(balance)) throw new InsufficientBalanceError();

        yield* this.updateAllowance({
            amount: amount,
            targetAddress: this.web3.getLedgerAddress(),
            tokenAddress: this.web3.getTokenAddress()
        });

        const depositTx = await ledgerContract.connect(signer).deposit(amount);
        yield { key: DepositSteps.DEPOSITING, txHash: depositTx.hash };

        const cr = await depositTx.wait();
        const log = findLog(cr, ledgerContract.interface, "Deposited");
        if (!log) {
            throw new FailedDepositError();
        }

        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!amount.eq(parsedLog.args["depositAmount"])) {
            throw new AmountMismatchError(amount, parsedLog.args["depositAmount"]);
        }
        yield { key: DepositSteps.DONE, amount: amount };
    }

    /**
     * 토큰을 인출합니다.
     * @param {BigNumber} amount 금액
     * @return {AsyncGenerator<WithdrawStepValue>}
     */
    public async *withdraw(amount: BigNumber): AsyncGenerator<WithdrawStepValue> {
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

        const account: string = await signer.getAddress();

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const currentDepositAmount = await ledgerContract.tokenBalanceOf(account);
        if (currentDepositAmount.lte(amount)) throw new InsufficientBalanceError();

        const tx = await ledgerContract.connect(signer).withdraw(amount);
        yield { key: WithdrawSteps.WITHDRAWING, txHash: tx.hash };

        const cr = await tx.wait();
        const log = findLog(cr, ledgerContract.interface, "Withdrawn");
        if (!log) {
            throw new FailedWithdrawError();
        }

        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!amount.eq(parsedLog.args["withdrawAmount"])) {
            throw new AmountMismatchError(amount, parsedLog.args["withdrawAmount"]);
        }
        yield { key: WithdrawSteps.DONE, amount: amount };
    }

    /**
     * 수당이 충분한지 확인하고 업데이트합니다.
     *
     * @param {UpdateAllowanceParams} params
     * @return {*}  {AsyncGenerator<UpdateAllowanceStepValue>}
     * @memberof ClientMethods
     */
    public async *updateAllowance(params: UpdateAllowanceParams): AsyncGenerator<UpdateAllowanceStepValue> {
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

        const tokenInstance = Token__factory.connect(params.tokenAddress, signer);
        const currentAllowance = await tokenInstance.allowance(await signer.getAddress(), params.targetAddress);

        yield {
            key: DepositSteps.CHECKED_ALLOWANCE,
            allowance: currentAllowance
        };

        if (currentAllowance.gte(params.amount)) return;

        const tx: ContractTransaction = await tokenInstance.approve(
            params.targetAddress,
            BigNumber.from(params.amount)
        );

        yield {
            key: DepositSteps.UPDATING_ALLOWANCE,
            txHash: tx.hash
        };

        const cr = await tx.wait();
        const log = findLog(cr, tokenInstance.interface, "Approval");

        if (!log) {
            throw new UpdateAllowanceError();
        }
        const value = log.data;
        if (!value || BigNumber.from(params.amount).gt(BigNumber.from(value))) {
            throw new UpdateAllowanceError();
        }

        yield {
            key: DepositSteps.UPDATED_ALLOWANCE,
            allowance: params.amount
        };
    }

    public async *payPoint(param: FetchPayOption): AsyncGenerator<PayPointStepValue> {
        const provider = this.web3.getProvider();
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const res = await Network.post(await this.getEndpoint("payPoint"), param);
        if (res?.code !== 200) throw new InternalServerError(res.message);
        if (res?.data?.code && res.data.code !== 200) throw new InternalServerError(res?.data?.error?.message ?? "");

        yield { key: PayPointSteps.PAYING_POINT, txHash: res.data.txHash, purchaseId: param.purchaseId };

        const txResponse = (await provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await txResponse.wait();
        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);

        const log = findLog(txReceipt, ledgerContract.interface, "PaidPoint");
        if (!log) {
            throw new FailedPayPointError();
        }
        const amount = BigNumber.from(param.amount);
        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!amount.eq(parsedLog.args["value"])) {
            throw new AmountMismatchError(amount, parsedLog.args["value"]);
        }
        yield {
            key: PayPointSteps.DONE,
            purchaseId: param.purchaseId,
            amount: amount,
            paidAmountPoint: parsedLog.args["paidAmountPoint"],
            balancePoint: parsedLog.args["balancePoint"]
        };
    }

    public async *payToken(param: FetchPayOption): AsyncGenerator<PayTokenStepValue> {
        const provider = this.web3.getProvider();
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const res = await Network.post(await this.getEndpoint("payToken"), param);
        if (res?.code !== 200) throw new InternalServerError(res.message);
        if (res?.data?.code && res.data.code !== 200) throw new InternalServerError(res?.data?.error?.message ?? "");

        yield { key: PayTokenSteps.PAYING_TOKEN, txHash: res.data.txHash, purchaseId: param.purchaseId };

        const txResponse = (await provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await txResponse.wait();
        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);

        const log = findLog(txReceipt, ledgerContract.interface, "PaidToken");
        if (!log) {
            throw new FailedPayTokenError();
        }
        const amount = BigNumber.from(param.amount);
        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!amount.eq(parsedLog.args["value"])) {
            throw new AmountMismatchError(amount, parsedLog.args["value"]);
        }
        yield {
            key: PayTokenSteps.DONE,
            purchaseId: param.purchaseId,
            amount: amount,
            paidAmountToken: parsedLog.args["paidAmountToken"],
            balanceToken: parsedLog.args["balanceToken"]
        };
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

    /**
     * 적립되는 로얄티의 종류를 설정하기 위한 옵션을 생성한다.
     * @param type - 로얄티의 종류
     * @return {Promise<PayPointOption>}
     */
    public async createOptionOfChangeRoyaltyType(type: RoyaltyType): Promise<ChangeRoyaltyTypeOption> {
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

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const account: string = await signer.getAddress();

        const nonce = await ledgerContract.nonceOf(account);
        const signature = await ContractUtils.signRoyaltyType(signer, type, nonce);

        const relayParam: ChangeRoyaltyTypeOption = {
            type,
            account,
            signature
        };
        return Promise.resolve(relayParam);
    }

    public async *changeRoyaltyType(param: ChangeRoyaltyTypeOption): AsyncGenerator<ChangeRoyaltyTypeStepValue> {
        const provider = this.web3.getProvider();
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const res = await Network.post(await this.getEndpoint("royaltyType"), param);
        if (res?.code !== 200) throw new InternalServerError(res.message);
        if (res?.data?.code && res.data.code !== 200) throw new InternalServerError(res?.data?.error?.message ?? "");

        yield { key: ChangeRoyaltyTypeSteps.DOING, txHash: res.data.txHash };

        const txResponse = (await provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await txResponse.wait();
        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);

        const log = findLog(txReceipt, ledgerContract.interface, "ChangedPointType");
        if (!log) {
            throw new FailedPayTokenError();
        }
        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!param.type === parsedLog.args["pointType"]) {
            throw new RoyaltyTypeMismatchError(param.type, parsedLog.args["value"]);
        }

        yield {
            key: ChangeRoyaltyTypeSteps.DONE,
            type: parsedLog.args["pointType"]
        };
    }

    /**
     * 적립되는 로얄티의 종류를 리턴한다.
     * @param {string} account - 지갑 주소
     * @return {Promise<BigNumber>} 포인트 잔고
     */
    public async getRoyaltyType(account: string): Promise<RoyaltyType> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);
        return await ledgerInstance.pointTypeOf(account);
    }

    public async getUserTradeHistory(
        account: string,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryUserTradeHistory;
        const where = { account: account };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        const res = await this.graphql.request({ query, params, name });
        return res;
    }

    public async getUserPointInputTradeHistory(
        account: string,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryUserTradeHistory;
        const where = { account: account, assetFlow: "PointInput" };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        const res = await this.graphql.request({ query, params, name });
        return res;
    }

    public async getUserTokenInputTradeHistory(
        account: string,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryUserTradeHistory;
        const where = { account: account, assetFlow: "TokenInput" };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        const res = await this.graphql.request({ query, params, name });
        return res;
    }

    public async getUserPointOutputTradeHistory(
        account: string,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryUserTradeHistory;
        const where = { account: account, assetFlow: "PointOutput" };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        const res = await this.graphql.request({ query, params, name });
        return res;
    }

    public async getUserTokenOutputTradeHistory(
        account: string,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryUserTradeHistory;
        const where = { account: account, assetFlow: "TokenOutput" };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        const res = await this.graphql.request({ query, params, name });
        return res;
    }

    public async getPaidToken(account: string, purchaseId: string): Promise<any> {
        const query = QueryPaidToken;
        const where = { account: account, purchaseId: purchaseId };
        const params = { where };
        const name = "paid token";
        const res = await this.graphql.request({ query, params, name });
        return res;
    }

    public async getPaidPoint(account: string, purchaseId: string): Promise<any> {
        const query = QueryPaidPoint;
        const where = { account: account, purchaseId: purchaseId };
        const params = { where };
        const name = "paid token";
        const res = await this.graphql.request({ query, params, name });
        return res;
    }
}
