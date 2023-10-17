import {
    ClientCore,
    Context,
    IClientHttpCore,
    LIVE_CONTRACTS,
    SupportedNetworks,
    SupportedNetworksArray
} from "../../client-common";
import { ILedgerMethods } from "../../interface/ILedger";
import { Ledger, Ledger__factory, Token, Token__factory } from "dms-osx-lib";
import { Provider } from "@ethersproject/providers";
import { NoProviderError, NoSignerError, UnsupportedNetworkError, UpdateAllowanceError } from "dms-sdk-common";
import { ContractUtils } from "../../utils/ContractUtils";
import {
    ChangeRoyaltyTypeSteps,
    ChangeRoyaltyTypeStepValue,
    ChangeToPayablePointSteps,
    ChangeToPayablePointStepValue,
    DepositSteps,
    DepositStepValue,
    PayPointSteps,
    PayPointStepValue,
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
    MismatchApproveAddressError,
    NoHttpModuleError,
    RoyaltyTypeMismatchError,
    UnregisteredPhoneError
} from "../../utils/errors";
import { Network } from "../../client-common/interfaces/network";
import { findLog } from "../../client-common/utils";

import { BigNumber } from "@ethersproject/bignumber";
import { ContractTransaction } from "@ethersproject/contracts";
import { getNetwork } from "@ethersproject/networks";
import { QueryUserTradeHistory } from "../graphql-queries/history";
import { QueryPaidToken } from "../graphql-queries/paidToken";
import { QueryPaidPoint } from "../graphql-queries/paidPoint";
import { PhoneLinkCollection, PhoneLinkCollection__factory } from "del-osx-lib";
import { AddressZero } from "@ethersproject/constants";

/**
 * Methods module the SDK Generic Client
 */
export class LedgerMethods extends ClientCore implements ILedgerMethods, IClientHttpCore {
    private relayEndpoint: string | URL | undefined;

    constructor(context: Context) {
        super(context);
        if (context.relayEndpoint) {
            this.relayEndpoint = context.relayEndpoint;
        }
        Object.freeze(LedgerMethods.prototype);
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

    public async getFeeRate(): Promise<number> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);

        return await ledgerInstance.fee();
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
        if (!amount.eq(parsedLog.args["depositedToken"])) {
            throw new AmountMismatchError(amount, parsedLog.args["depositedToken"]);
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
        if (!amount.eq(parsedLog.args["withdrawnToken"])) {
            throw new AmountMismatchError(amount, parsedLog.args["withdrawnToken"]);
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

    /**
     * 포인트를 사용하여 상품을 구매한다.
     * @param purchaseId - 거래 아이디
     * @param amount - 거래금액
     * @param currency - 통화코드
     * @param shopId - 상점 아이디
     * @return {AsyncGenerator<PayPointStepValue>}
     */
    public async *payPoint(
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: string
    ): AsyncGenerator<PayPointStepValue> {
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

        const param = {
            purchaseId,
            amount: amount.toString(),
            currency,
            shopId,
            account,
            signature
        };

        yield {
            key: PayPointSteps.PREPARED,
            purchaseId,
            amount,
            currency,
            shopId,
            account,
            signature
        };

        const res = await Network.post(await this.getEndpoint("payPoint"), param);
        if (res?.code !== 200) throw new InternalServerError(res.message);
        if (res?.data?.code && res.data.code !== 200) throw new InternalServerError(res?.data?.error?.message ?? "");

        yield { key: PayPointSteps.SENT, txHash: res.data.txHash, purchaseId: param.purchaseId };

        const txResponse = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await txResponse.wait();

        const log = findLog(txReceipt, ledgerContract.interface, "PaidPoint");
        if (!log) {
            throw new FailedPayPointError();
        }
        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!amount.eq(parsedLog.args["paidValue"])) {
            throw new AmountMismatchError(amount, parsedLog.args["paidValue"]);
        }
        yield {
            key: PayPointSteps.DONE,
            purchaseId,
            currency,
            shopId,
            paidPoint: parsedLog.args["paidPoint"],
            paidValue: parsedLog.args["paidValue"],
            feePoint: parsedLog.args["feePoint"],
            feeValue: parsedLog.args["feeValue"],
            balancePoint: parsedLog.args["balancePoint"]
        };
    }

    /**
     * 토큰을 사용하여 상품을 구매한다.
     * @param purchaseId - 거래 아이디
     * @param amount - 거래금액
     * @param currency - 통화코드
     * @param shopId - 상점 아이디
     * @return {AsyncGenerator<PayTokenStepValue>}
     */
    public async *payToken(
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: string
    ): AsyncGenerator<PayTokenStepValue> {
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

        const param = {
            purchaseId,
            amount: amount.toString(),
            currency,
            shopId,
            account,
            signature
        };

        yield {
            key: PayTokenSteps.PREPARED,
            purchaseId,
            amount,
            currency,
            shopId,
            account,
            signature
        };

        const res = await Network.post(await this.getEndpoint("payToken"), param);
        if (res?.code !== 200) throw new InternalServerError(res.message);
        if (res?.data?.code && res.data.code !== 200) throw new InternalServerError(res?.data?.error?.message ?? "");

        yield { key: PayTokenSteps.SENT, txHash: res.data.txHash, purchaseId: param.purchaseId };

        const txResponse = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await txResponse.wait();

        const log = findLog(txReceipt, ledgerContract.interface, "PaidToken");
        if (!log) {
            throw new FailedPayTokenError();
        }
        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!amount.eq(parsedLog.args["paidValue"])) {
            throw new AmountMismatchError(amount, parsedLog.args["paidValue"]);
        }
        yield {
            key: PayTokenSteps.DONE,
            purchaseId,
            currency,
            shopId,
            paidToken: parsedLog.args["paidToken"],
            paidValue: parsedLog.args["paidValue"],
            feeToken: parsedLog.args["feeToken"],
            feeValue: parsedLog.args["feeValue"],
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
     * 적립되는 로얄티의 종류를 변경한다.
     * @param type - 로얄티의 종류
     * @return {AsyncGenerator<ChangeRoyaltyTypeStepValue>}
     */
    public async *changeRoyaltyType(type: RoyaltyType): AsyncGenerator<ChangeRoyaltyTypeStepValue> {
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

        yield { key: ChangeRoyaltyTypeSteps.PREPARED, type, account, signature };

        const param = {
            type,
            account,
            signature
        };

        const res = await Network.post(await this.getEndpoint("changeRoyaltyType"), param);
        if (res?.code !== 200) throw new InternalServerError(res.message);
        if (res?.data?.code && res.data.code !== 200) throw new InternalServerError(res?.data?.error?.message ?? "");

        yield { key: ChangeRoyaltyTypeSteps.SENT, txHash: res.data.txHash };

        const txResponse = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await txResponse.wait();

        const log = findLog(txReceipt, ledgerContract.interface, "ChangedRoyaltyType");
        if (!log) {
            throw new FailedPayTokenError();
        }
        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!param.type === parsedLog.args["royaltyType"]) {
            throw new RoyaltyTypeMismatchError(param.type, parsedLog.args["value"]);
        }

        yield {
            key: ChangeRoyaltyTypeSteps.DONE,
            type: parsedLog.args["royaltyType"]
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
        return await ledgerInstance.royaltyTypeOf(account);
    }

    public async *changeToPayablePoint(phone: string): AsyncGenerator<ChangeToPayablePointStepValue> {
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

        const phoneHash = ContractUtils.getPhoneHash(phone.trim());
        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const account: string = await signer.getAddress();
        const nonce = await ledgerContract.nonceOf(account);
        const signature = await ContractUtils.signChangePayablePoint(signer, phoneHash, nonce);

        const balance = await ledgerContract.unPayablePointBalanceOf(phoneHash);
        if (balance.eq(BigNumber.from(0))) {
            throw new InsufficientBalanceError();
        }
        yield { key: ChangeToPayablePointSteps.PREPARED, phone, phoneHash, account, signature, balance };

        const linkContract: PhoneLinkCollection = PhoneLinkCollection__factory.connect(
            this.web3.getLinkCollectionAddress(),
            signer.provider
        );

        const param = {
            phone: phoneHash,
            account,
            signature
        };
        const phoneToAddress: string = await linkContract.toAddress(param.phone);
        if (phoneToAddress === AddressZero) throw new UnregisteredPhoneError();
        if (phoneToAddress !== param.account) throw new MismatchApproveAddressError();

        const res = await Network.post(await this.getEndpoint("changeToPayablePoint"), param);
        if (res?.code !== 200) throw new InternalServerError(res.message);
        if (res?.data?.code && res.data.code !== 200) throw new InternalServerError(res?.data?.error?.message ?? "");

        yield { key: ChangeToPayablePointSteps.SENT, txHash: res.data.txHash };

        const txResponse = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await txResponse.wait();

        const log = findLog(txReceipt, ledgerContract.interface, "ChangedToPayablePoint");
        if (!log) {
            throw new FailedPayTokenError();
        }
        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!balance.eq(parsedLog.args["changedPoint"])) {
            throw new AmountMismatchError(balance, parsedLog.args["changedPoint"]);
        }

        yield {
            key: ChangeToPayablePointSteps.DONE
        };
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
