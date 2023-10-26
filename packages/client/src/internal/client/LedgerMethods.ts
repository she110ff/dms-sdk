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
    ChangeLoyaltyTypeStepValue,
    ChangeToPayablePointStepValue,
    DepositSteps,
    DepositStepValue,
    NormalSteps,
    PayPointStepValue,
    PayTokenStepValue,
    QueryOption,
    LoyaltyType,
    SortByBlock,
    SortDirection,
    UpdateAllowanceParams,
    UpdateAllowanceStepValue,
    WithdrawSteps,
    WithdrawStepValue,
    SignatureZero
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
    UnregisteredPhoneError
} from "../../utils/errors";
import { Network } from "../../client-common/interfaces/network";
import { findLog } from "../../client-common/utils";

import { BigNumber } from "@ethersproject/bignumber";
import { ContractTransaction } from "@ethersproject/contracts";
import { getNetwork } from "@ethersproject/networks";
import { QueryUserTradeHistory } from "../graphql-queries/user/history";
import { QueryPaidToken } from "../graphql-queries/user/paidToken";
import { QueryPaidPoint } from "../graphql-queries/user/paidPoint";
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
     * 컨트랙트에 저장된 수수료 율을 리턴한다.
     */
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
     * 허용된 금액이 충분한지 확인하고 그렇지 않으면 업데이트합니다.
     * @param {UpdateAllowanceParams} params
     * @return {*}  {AsyncGenerator<UpdateAllowanceStepValue>}
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
     * @param useRelay - 이값이 true 이면 릴레이 서버를 경유해서 전송합니다. 그렇지 않으면 직접 컨트랙트를 호출합니다.
     * @return {AsyncGenerator<PayPointStepValue>}
     */
    public async *payPoint(
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: string,
        useRelay: boolean = true
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
        let contractTx: ContractTransaction;
        if (useRelay) {
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
                key: NormalSteps.PREPARED,
                purchaseId,
                amount,
                currency,
                shopId,
                account,
                signature
            };

            const res = await Network.post(await this.getEndpoint("/ledger/payPoint"), param);
            if (res?.code !== 200) throw new InternalServerError(res.message);
            if (res?.data?.code && res.data.code !== 200)
                throw new InternalServerError(res?.data?.error?.message ?? "");

            contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

            yield { key: NormalSteps.SENT, txHash: res.data.txHash, purchaseId: param.purchaseId };
        } else {
            const param = {
                purchaseId,
                amount: amount.toString(),
                currency,
                shopId
            };

            yield {
                key: NormalSteps.PREPARED,
                purchaseId,
                amount,
                currency,
                shopId,
                account,
                signature: SignatureZero
            };

            contractTx = await ledgerContract.payPointDirect(param);

            yield { key: NormalSteps.SENT, txHash: contractTx.hash, purchaseId: param.purchaseId };
        }

        const txReceipt = await contractTx.wait();

        const log = findLog(txReceipt, ledgerContract.interface, "PaidPoint");
        if (!log) {
            throw new FailedPayPointError();
        }
        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!amount.eq(parsedLog.args["paidValue"])) {
            throw new AmountMismatchError(amount, parsedLog.args["paidValue"]);
        }
        yield {
            key: NormalSteps.DONE,
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
     * @param useRelay - 이값이 true 이면 릴레이 서버를 경유해서 전송합니다. 그렇지 않으면 직접 컨트랙트를 호출합니다.
     * @return {AsyncGenerator<PayTokenStepValue>}
     */
    public async *payToken(
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: string,
        useRelay: boolean = true
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
        let contractTx: ContractTransaction;
        if (useRelay) {
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
                key: NormalSteps.PREPARED,
                purchaseId,
                amount,
                currency,
                shopId,
                account,
                signature
            };

            const res = await Network.post(await this.getEndpoint("/ledger/payToken"), param);
            if (res?.code !== 200) throw new InternalServerError(res.message);
            if (res?.data?.code && res.data.code !== 200)
                throw new InternalServerError(res?.data?.error?.message ?? "");

            yield { key: NormalSteps.SENT, txHash: res.data.txHash, purchaseId: param.purchaseId };

            contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

            yield { key: NormalSteps.SENT, txHash: res.data.txHash, purchaseId: param.purchaseId };
        } else {
            const param = {
                purchaseId,
                amount: amount.toString(),
                currency,
                shopId
            };

            yield {
                key: NormalSteps.PREPARED,
                purchaseId,
                amount,
                currency,
                shopId,
                account,
                signature: SignatureZero
            };

            contractTx = await ledgerContract.payTokenDirect(param);

            yield { key: NormalSteps.SENT, txHash: contractTx.hash, purchaseId: param.purchaseId };
        }

        const txReceipt = await contractTx.wait();

        const log = findLog(txReceipt, ledgerContract.interface, "PaidToken");
        if (!log) {
            throw new FailedPayTokenError();
        }

        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!amount.eq(parsedLog.args["paidValue"])) {
            throw new AmountMismatchError(amount, parsedLog.args["paidValue"]);
        }

        yield {
            key: NormalSteps.DONE,
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

    /**
     * 적립되는 로얄티의 종류를 변경한다.
     * @param useRelay - 이값이 true 이면 릴레이 서버를 경유해서 전송합니다. 그렇지 않으면 직접 컨트랙트를 호출합니다.
     * @return {AsyncGenerator<ChangeLoyaltyTypeStepValue>}
     */
    public async *changeToLoyaltyToken(useRelay: boolean = true): AsyncGenerator<ChangeLoyaltyTypeStepValue> {
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
        let contractTx: ContractTransaction;
        if (useRelay) {
            const nonce = await ledgerContract.nonceOf(account);
            const signature = await ContractUtils.signLoyaltyType(signer, nonce);

            yield { key: NormalSteps.PREPARED, account, signature };

            const param = {
                account,
                signature
            };
            const res = await Network.post(await this.getEndpoint("/ledger/changeToLoyaltyToken"), param);
            if (res?.code !== 200) throw new InternalServerError(res.message);
            if (res?.data?.code && res.data.code !== 200)
                throw new InternalServerError(res?.data?.error?.message ?? "");

            contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

            yield { key: NormalSteps.SENT, txHash: res.data.txHash };
        } else {
            yield { key: NormalSteps.PREPARED, account, signature: SignatureZero };

            contractTx = await ledgerContract.changeToLoyaltyTokenDirect();

            yield { key: NormalSteps.SENT, txHash: contractTx.hash };
        }
        const txReceipt = await contractTx.wait();

        const log = findLog(txReceipt, ledgerContract.interface, "ChangedToLoyaltyToken");
        if (!log) {
            throw new FailedPayTokenError();
        }
        const parsedLog = ledgerContract.interface.parseLog(log);

        yield {
            key: NormalSteps.DONE,
            account: parsedLog.args["account"],
            amountToken: parsedLog.args["amountToken"],
            amountPoint: parsedLog.args["amountPoint"],
            balanceToken: parsedLog.args["balanceToken"]
        };
    }

    /**
     * 적립되는 로얄티의 종류를 리턴한다.
     * @param {string} account - 지갑 주소
     * @return {Promise<BigNumber>} 포인트 잔고
     */
    public async getLoyaltyType(account: string): Promise<LoyaltyType> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);
        return await ledgerInstance.loyaltyTypeOf(account);
    }

    /**
     * 사용가능한 포인트로 변환한다.
     * @param phone 전화번호
     * @param useRelay - 이값이 true 이면 릴레이 서버를 경유해서 전송합니다. 그렇지 않으면 직접 컨트랙트를 호출합니다.
     * @return {AsyncGenerator<ChangeToPayablePointStepValue>}
     */
    public async *changeToPayablePoint(
        phone: string,
        useRelay: boolean = true
    ): AsyncGenerator<ChangeToPayablePointStepValue> {
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

        const phoneHash = ContractUtils.getPhoneHash(phone.trim());
        const balance = await ledgerContract.unPayablePointBalanceOf(phoneHash);
        if (balance.eq(BigNumber.from(0))) {
            throw new InsufficientBalanceError();
        }

        const linkContract: PhoneLinkCollection = PhoneLinkCollection__factory.connect(
            this.web3.getLinkCollectionAddress(),
            signer.provider
        );
        const phoneToAddress: string = await linkContract.toAddress(phoneHash);
        if (phoneToAddress === AddressZero) throw new UnregisteredPhoneError();
        if (phoneToAddress !== (await signer.getAddress())) throw new MismatchApproveAddressError();

        const account: string = await signer.getAddress();
        let contractTx: ContractTransaction;
        if (useRelay) {
            const nonce = await ledgerContract.nonceOf(account);
            const signature = await ContractUtils.signChangePayablePoint(signer, phoneHash, nonce);

            const param = {
                phone: phoneHash,
                account,
                signature
            };

            yield { key: NormalSteps.PREPARED, phone, phoneHash, account, signature, balance };

            const res = await Network.post(await this.getEndpoint("/ledger/changeToPayablePoint"), param);
            if (res?.code !== 200) throw new InternalServerError(res.message);
            if (res?.data?.code && res.data.code !== 200)
                throw new InternalServerError(res?.data?.error?.message ?? "");

            contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

            yield { key: NormalSteps.SENT, txHash: res.data.txHash };
        } else {
            yield {
                key: NormalSteps.PREPARED,
                phone,
                phoneHash,
                account,
                signature: SignatureZero,
                balance
            };

            contractTx = await ledgerContract.changeToPayablePointDirect(phoneHash);

            yield { key: NormalSteps.SENT, txHash: contractTx.hash };
        }
        const txReceipt = await contractTx.wait();

        const log = findLog(txReceipt, ledgerContract.interface, "ChangedToPayablePoint");
        if (!log) {
            throw new FailedPayTokenError();
        }
        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!balance.eq(parsedLog.args["changedPoint"])) {
            throw new AmountMismatchError(balance, parsedLog.args["changedPoint"]);
        }

        yield {
            key: NormalSteps.DONE
        };
    }

    /**
     * 사용자의 거래내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param limit
     * @param skip
     * @param sortDirection
     * @param sortBy
     */
    public async getAllHistory(
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
        return await this.graphql.request({ query, params, name });
    }

    /**
     * 사용자의 로열티 적립내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param limit
     * @param skip
     * @param sortDirection
     * @param sortBy
     */
    public async getSaveHistory(
        account: string,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryUserTradeHistory;
        const where = { account: account, assetFlow: "Save" };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        return await this.graphql.request({ query, params, name });
    }

    /**
     * 사용자의 로열티 사용내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param limit
     * @param skip
     * @param sortDirection
     * @param sortBy
     */
    public async getUseHistory(
        account: string,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryUserTradeHistory;
        const where = { account: account, assetFlow: "Use" };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        return await this.graphql.request({ query, params, name });
    }

    /**
     * 사용자의 토큰 예치 내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param limit
     * @param skip
     * @param sortDirection
     * @param sortBy
     */
    public async getDepositHistory(
        account: string,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryUserTradeHistory;
        const where = { account: account, assetFlow: "Deposit" };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        return await this.graphql.request({ query, params, name });
    }

    /**
     * 사용자의 토큰 인출 내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param limit
     * @param skip
     * @param sortDirection
     * @param sortBy
     */
    public async getWithdrawHistory(
        account: string,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryUserTradeHistory;
        const where = { account: account, assetFlow: "Withdraw" };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        return await this.graphql.request({ query, params, name });
    }

    /**
     * 사용자의 토큰구매 결과를 제공한다.
     * @param account 사용자의 지갑주소
     * @param purchaseId 구매번호
     */
    public async getPaidToken(account: string, purchaseId: string): Promise<any> {
        const query = QueryPaidToken;
        const where = { account: account, purchaseId: purchaseId };
        const params = { where };
        const name = "paid token";
        return await this.graphql.request({ query, params, name });
    }

    /**
     * 사용자의 포인트구매 결과를 제공한다.
     * @param account 사용자의 지갑주소
     * @param purchaseId 구매번호
     */
    public async getPaidPoint(account: string, purchaseId: string): Promise<any> {
        const query = QueryPaidPoint;
        const where = { account: account, purchaseId: purchaseId };
        const params = { where };
        const name = "paid token";
        return await this.graphql.request({ query, params, name });
    }
}
