import {
    ClientCore,
    Context,
    IClientHttpCore,
    LIVE_CONTRACTS,
    SupportedNetwork,
    SupportedNetworkArray
} from "../../client-common";
import { ILedgerMethods } from "../../interface/ILedger";
import {
    Ledger,
    Ledger__factory,
    IBridge,
    IBridge__factory,
    LoyaltyConsumer,
    LoyaltyConsumer__factory,
    LoyaltyExchanger,
    LoyaltyExchanger__factory,
    LoyaltyToken,
    LoyaltyToken__factory,
    LoyaltyTransfer,
    LoyaltyTransfer__factory
} from "dms-osx-lib";
import { JsonRpcProvider, Provider } from "@ethersproject/providers";
import { NoProviderError, NoSignerError, UnsupportedNetworkError, UpdateAllowanceError } from "dms-sdk-common";
import { ContractUtils } from "../../utils/ContractUtils";
import { GasPriceManager } from "../../utils/GasPriceManager";
import { NonceManager } from "../../utils/NonceManager";
import {
    ChangeLoyaltyTypeStepValue,
    ChangeToPayablePointStepValue,
    DepositSteps,
    DepositStepValue,
    NormalSteps,
    QueryOption,
    LoyaltyType,
    SortByBlock,
    SortDirection,
    UpdateAllowanceParams,
    UpdateAllowanceStepValue,
    WithdrawSteps,
    WithdrawStepValue,
    PaymentDetailData,
    ApproveNewPaymentValue,
    LoyaltyPaymentEvent,
    ApproveCancelPaymentValue,
    LedgerPageType,
    PaymentDetailTaskStatus,
    MobileType,
    RemovePhoneInfoStepValue,
    DelegatedTransferStepValue,
    DepositViaBridgeStepValue,
    IChainInfo,
    WaiteBridgeStepValue,
    WaiteBridgeSteps
} from "../../interfaces";
import {
    AmountMismatchError,
    FailedApprovePayment,
    FailedDepositError,
    FailedPayTokenError,
    FailedRemovePhoneInfoError,
    FailedTransactionError,
    FailedWithdrawError,
    InsufficientBalanceError,
    InternalServerError,
    MismatchedAddressError,
    NoHttpModuleError,
    UnregisteredPhoneError
} from "../../utils/errors";
import { Network } from "../../client-common/interfaces/network";
import { findLog } from "../../client-common/utils";
import { getNetwork } from "../../utils/Utilty";

import { BigNumber } from "@ethersproject/bignumber";
import { ContractTransaction } from "@ethersproject/contracts";
import { QueryUserTradeHistory } from "../graphql-queries/user/history";
import { PhoneLinkCollection, PhoneLinkCollection__factory } from "del-osx-lib";
import { AddressZero } from "@ethersproject/constants";
import { BytesLike } from "@ethersproject/bytes";

/**
 * 사용자의 포인트/토큰의 잔고와 제품구매를 하는 기능이 포함되어 있다.
 */
export class LedgerMethods extends ClientCore implements ILedgerMethods, IClientHttpCore {
    private relayEndpoint: string | URL | undefined;
    private mainChainInfo: IChainInfo | undefined;
    private sideChainInfo: IChainInfo | undefined;

    constructor(context: Context) {
        super(context);
        if (context.relayEndpoint) {
            this.relayEndpoint = context.relayEndpoint;
        }
        // Object.freeze(LedgerMethods.prototype);
        // Object.freeze(this);
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
            const networkName = network.name as SupportedNetwork;
            if (!SupportedNetworkArray.includes(networkName)) {
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
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
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
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
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
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
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
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);

        return await ledgerInstance.getFee();
    }

    public async getPaymentDetail(paymentId: BytesLike): Promise<PaymentDetailData> {
        const res = await Network.get(await this.getEndpoint("/v1/payment/item"), {
            paymentId: paymentId.toString()
        });
        if (res.code !== 0 || res.data === undefined) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        let detail: PaymentDetailData;

        try {
            detail = {
                paymentId: res.data.paymentId,
                purchaseId: res.data.purchaseId,
                amount: BigNumber.from(res.data.amount),
                currency: res.data.currency,
                shopId: res.data.shopId,
                account: res.data.account,
                loyaltyType: res.data.loyaltyType,
                paidPoint: BigNumber.from(res.data.paidPoint),
                paidToken: BigNumber.from(res.data.paidToken),
                paidValue: BigNumber.from(res.data.paidValue),
                feePoint: BigNumber.from(res.data.feePoint),
                feeToken: BigNumber.from(res.data.feeToken),
                feeValue: BigNumber.from(res.data.feeValue),
                totalPoint: BigNumber.from(res.data.totalPoint),
                totalToken: BigNumber.from(res.data.totalToken),
                totalValue: BigNumber.from(res.data.totalValue),
                paymentStatus: res.data.paymentStatus
            };
        } catch (_) {
            throw new InternalServerError("Error parsing receiving data");
        }

        return detail;
    }

    public async *approveNewPayment(
        paymentId: BytesLike,
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: BytesLike,
        approval: boolean
    ): AsyncGenerator<ApproveNewPaymentValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await signer.provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const account: string = await signer.getAddress();
        const nonce = await ledgerContract.nonceOf(account);
        const signature = await ContractUtils.signLoyaltyNewPayment(
            signer,
            paymentId,
            purchaseId,
            amount,
            currency,
            shopId,
            nonce,
            network.chainId
        );

        const param = {
            paymentId,
            approval,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            paymentId,
            purchaseId,
            amount,
            currency,
            shopId,
            approval,
            account,
            signature
        };

        const res = await Network.post(await this.getEndpoint("/v1/payment/new/approval"), param);
        if (res.code !== 0 || res.data === undefined) {
            console.log(res.code);
            console.log(res?.error?.message ?? "");
            throw new InternalServerError(res?.error?.message ?? "");
        }
        if (approval) {
            yield {
                key: NormalSteps.SENT,
                paymentId,
                purchaseId,
                amount,
                currency,
                shopId,
                approval,
                account,
                txHash: res.data.txHash
            };

            const consumerContract: LoyaltyConsumer = LoyaltyConsumer__factory.connect(
                this.web3.getLoyaltyConsumerAddress(),
                signer
            );

            let event: LoyaltyPaymentEvent | undefined = undefined;
            event = await this.waitPaymentLoyalty(
                consumerContract,
                (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction
            );
            if (event === undefined) event = await this.waitNewPaymentLoyaltyFromDetail(paymentId);
            if (event === undefined) throw new FailedApprovePayment();

            yield {
                key: NormalSteps.APPROVED,
                paymentId: event.paymentId,
                purchaseId: event.purchaseId,
                amount: event.paidValue,
                currency: event.currency,
                shopId: event.shopId,
                approval,
                account: event.account,
                loyaltyType: event.loyaltyType,
                paidPoint: event.paidPoint,
                paidToken: event.paidToken,
                paidValue: event.paidValue,
                feePoint: event.feePoint,
                feeToken: event.feeToken,
                feeValue: event.feeValue,
                totalPoint: event.totalPoint,
                totalToken: event.totalToken,
                totalValue: event.totalValue
            };
        } else {
            yield {
                key: NormalSteps.DENIED,
                paymentId,
                purchaseId,
                amount,
                currency,
                shopId,
                approval,
                account
            };
        }
    }

    private convertDetailToEvent(detail: PaymentDetailData): LoyaltyPaymentEvent {
        return {
            paymentId: detail.paymentId,
            purchaseId: detail.purchaseId,
            currency: detail.currency,
            shopId: detail.shopId,
            account: detail.account,
            timestamp: BigNumber.from(ContractUtils.getTimeStamp()),
            loyaltyType: detail.loyaltyType,
            paidPoint: detail.loyaltyType === LoyaltyType.POINT ? BigNumber.from(detail.paidPoint) : BigNumber.from(0),
            paidToken: detail.loyaltyType === LoyaltyType.TOKEN ? BigNumber.from(detail.paidToken) : BigNumber.from(0),
            paidValue: BigNumber.from(detail.paidValue),

            feePoint: detail.loyaltyType === LoyaltyType.POINT ? BigNumber.from(detail.feePoint) : BigNumber.from(0),
            feeToken: detail.loyaltyType === LoyaltyType.TOKEN ? BigNumber.from(detail.feeToken) : BigNumber.from(0),
            feeValue: BigNumber.from(detail.feeValue),
            totalPoint: detail.paidPoint.add(detail.feePoint),
            totalToken: detail.paidToken.add(detail.feeToken),
            totalValue: detail.paidValue.add(detail.feeValue)
        };
    }

    public async *approveCancelPayment(
        paymentId: BytesLike,
        purchaseId: string,
        approval: boolean
    ): AsyncGenerator<ApproveCancelPaymentValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await signer.provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const account: string = await signer.getAddress();
        const nonce = await ledgerContract.nonceOf(account);
        const signature = await ContractUtils.signLoyaltyCancelPayment(
            signer,
            paymentId,
            purchaseId,
            nonce,
            network.chainId
        );

        const param = {
            paymentId,
            approval,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            paymentId,
            purchaseId,
            approval,
            account,
            signature
        };

        const res = await Network.post(await this.getEndpoint("/v1/payment/cancel/approval"), param);
        if (res.code !== 0 || res.data === undefined) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
        if (approval) {
            yield {
                key: NormalSteps.SENT,
                paymentId,
                purchaseId,
                approval,
                account,
                txHash: res.data.txHash
            };

            const consumerContract: LoyaltyConsumer = LoyaltyConsumer__factory.connect(
                this.web3.getLoyaltyConsumerAddress(),
                signer
            );

            let event: LoyaltyPaymentEvent | undefined = undefined;
            event = await this.waitPaymentLoyalty(
                consumerContract,
                (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction
            );
            if (event === undefined) event = await this.waitCancelPaymentLoyaltyFromDetail(paymentId);
            if (event === undefined) throw new FailedApprovePayment();

            yield {
                key: NormalSteps.APPROVED,
                paymentId: event.paymentId,
                purchaseId: event.purchaseId,
                approval,
                account: account,
                loyaltyType: event.loyaltyType,
                paidPoint: event.paidPoint,
                paidToken: event.paidToken,
                paidValue: event.paidValue,
                feePoint: event.feePoint,
                feeToken: event.feeToken,
                feeValue: event.feeValue,
                totalPoint: event.totalPoint,
                totalToken: event.totalToken,
                totalValue: event.totalValue
            };
        } else {
            yield {
                key: NormalSteps.DENIED,
                paymentId,
                purchaseId,
                approval,
                account
            };
        }
    }

    private async waitPaymentLoyalty(
        contract: LoyaltyConsumer,
        tx: ContractTransaction
    ): Promise<LoyaltyPaymentEvent | undefined> {
        const res: any = {};
        const contractReceipt = await tx.wait();
        const log = findLog(contractReceipt, contract.interface, "LoyaltyPaymentEvent");
        if (log !== undefined) {
            const parsedLog = contract.interface.parseLog(log);

            res.paymentId = parsedLog.args.payment.paymentId;
            res.purchaseId = parsedLog.args.payment.purchaseId;
            res.amount = BigNumber.from(parsedLog.args.payment.paidValue);
            res.currency = parsedLog.args.payment.currency;
            res.shopId = parsedLog.args.payment.shopId;
            res.account = parsedLog.args.payment.account;
            res.timestamp = parsedLog.args.payment.timestamp;
            res.loyaltyType = parsedLog.args.payment.loyaltyType;
            res.paidPoint =
                parsedLog.args.payment.loyaltyType === LoyaltyType.POINT
                    ? BigNumber.from(parsedLog.args.payment.paidPoint)
                    : BigNumber.from(0);
            res.paidToken =
                parsedLog.args.payment.loyaltyType === LoyaltyType.TOKEN
                    ? BigNumber.from(parsedLog.args.payment.paidToken)
                    : BigNumber.from(0);
            res.paidValue = BigNumber.from(parsedLog.args.payment.paidValue);

            res.feePoint =
                parsedLog.args.payment.loyaltyType === LoyaltyType.POINT
                    ? BigNumber.from(parsedLog.args.payment.feePoint)
                    : BigNumber.from(0);
            res.feeToken =
                parsedLog.args.payment.loyaltyType === LoyaltyType.TOKEN
                    ? BigNumber.from(parsedLog.args.payment.feeToken)
                    : BigNumber.from(0);
            res.feeValue = BigNumber.from(parsedLog.args.payment.feeValue);

            res.totalPoint = res.paidPoint.add(res.feePoint);
            res.totalToken = res.paidToken.add(res.feeToken);
            res.totalValue = res.paidValue.add(res.feeValue);

            return res;
        } else return undefined;
    }

    private async waitNewPaymentLoyaltyFromDetail(paymentId: BytesLike): Promise<LoyaltyPaymentEvent | undefined> {
        const startTm = ContractUtils.getTimeStamp();
        while (true) {
            const detail = await this.getPaymentDetail(paymentId);
            if (
                detail.paymentStatus === PaymentDetailTaskStatus.APPROVED_NEW_CONFIRMED_TX ||
                detail.paymentStatus === PaymentDetailTaskStatus.REPLY_COMPLETED_NEW ||
                detail.paymentStatus === PaymentDetailTaskStatus.CLOSED_NEW
            ) {
                return this.convertDetailToEvent(detail);
            } else if (
                detail.paymentStatus === PaymentDetailTaskStatus.APPROVED_NEW_FAILED_TX ||
                detail.paymentStatus === PaymentDetailTaskStatus.APPROVED_NEW_REVERTED_TX
            ) {
                return undefined;
            }
            if (ContractUtils.getTimeStamp() - startTm > 10) break;
            await ContractUtils.delay(1000);
        }

        return undefined;
    }

    private async waitCancelPaymentLoyaltyFromDetail(paymentId: BytesLike): Promise<LoyaltyPaymentEvent | undefined> {
        const startTm = ContractUtils.getTimeStamp();
        while (true) {
            const detail = await this.getPaymentDetail(paymentId);
            if (
                detail.paymentStatus === PaymentDetailTaskStatus.APPROVED_CANCEL_CONFIRMED_TX ||
                detail.paymentStatus === PaymentDetailTaskStatus.REPLY_COMPLETED_CANCEL ||
                detail.paymentStatus === PaymentDetailTaskStatus.CLOSED_CANCEL
            ) {
                return this.convertDetailToEvent(detail);
            } else if (
                detail.paymentStatus === PaymentDetailTaskStatus.APPROVED_CANCEL_FAILED_TX ||
                detail.paymentStatus === PaymentDetailTaskStatus.APPROVED_CANCEL_REVERTED_TX
            ) {
                return undefined;
            }
            if (ContractUtils.getTimeStamp() - startTm > 10) break;
            await ContractUtils.delay(1000);
        }

        return undefined;
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
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const account: string = await signer.getAddress();

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const tokenContract: LoyaltyToken = LoyaltyToken__factory.connect(this.web3.getTokenAddress(), signer);

        const balance = await tokenContract.balanceOf(account);
        if (amount.gte(balance)) throw new InsufficientBalanceError();

        yield* this.updateAllowance({
            amount: amount,
            targetAddress: this.web3.getLedgerAddress(),
            tokenAddress: this.web3.getTokenAddress()
        });

        const nonceSigner = new NonceManager(new GasPriceManager(signer));
        const depositTx = await ledgerContract.connect(nonceSigner).deposit(amount);
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
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const account: string = await signer.getAddress();

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const currentDepositAmount = await ledgerContract.tokenBalanceOf(account);
        if (currentDepositAmount.lte(amount)) throw new InsufficientBalanceError();

        const nonceSigner = new NonceManager(new GasPriceManager(signer));
        const tx = await ledgerContract.connect(nonceSigner).withdraw(amount);
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
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const nonceSigner = new NonceManager(new GasPriceManager(signer));
        const tokenInstance = LoyaltyToken__factory.connect(params.tokenAddress, nonceSigner);
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
     * 적립되는 로얄티의 종류를 변경한다.
     * @return {AsyncGenerator<ChangeLoyaltyTypeStepValue>}
     */
    public async *changeToLoyaltyToken(): AsyncGenerator<ChangeLoyaltyTypeStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await signer.provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const account: string = await signer.getAddress();
        let contractTx: ContractTransaction;
        const nonce = await ledgerContract.nonceOf(account);
        const signature = await ContractUtils.signLoyaltyType(signer, nonce, network.chainId);

        yield { key: NormalSteps.PREPARED, account, signature };

        const param = {
            account,
            signature
        };
        const res = await Network.post(await this.getEndpoint("/v1/ledger/changeToLoyaltyToken"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, txHash: res.data.txHash };
        const txReceipt = await contractTx.wait();

        const exchangerContract: LoyaltyExchanger = LoyaltyExchanger__factory.connect(
            this.web3.getLedgerAddress(),
            signer
        );
        const log = findLog(txReceipt, exchangerContract.interface, "ChangedToLoyaltyToken");
        if (!log) {
            throw new FailedPayTokenError();
        }
        const parsedLog = exchangerContract.interface.parseLog(log);

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
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);
        return await ledgerInstance.loyaltyTypeOf(account);
    }

    /**
     * 사용가능한 포인트로 변환한다.
     * @param phone 전화번호
     * @return {AsyncGenerator<ChangeToPayablePointStepValue>}
     */
    public async *changeToPayablePoint(phone: string): AsyncGenerator<ChangeToPayablePointStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await signer.provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const phoneHash = ContractUtils.getPhoneHash(phone.trim());
        const balance = await ledgerContract.unPayablePointBalanceOf(phoneHash);
        if (balance.eq(BigNumber.from(0))) {
            throw new InsufficientBalanceError();
        }

        const linkContract: PhoneLinkCollection = PhoneLinkCollection__factory.connect(
            this.web3.getLinkAddress(),
            signer.provider
        );
        const phoneToAddress: string = await linkContract.toAddress(phoneHash);
        if (phoneToAddress === AddressZero) throw new UnregisteredPhoneError();
        if (phoneToAddress !== (await signer.getAddress())) throw new MismatchedAddressError();

        const account: string = await signer.getAddress();
        let contractTx: ContractTransaction;
        const nonce = await ledgerContract.nonceOf(account);
        const signature = await ContractUtils.signChangePayablePoint(signer, phoneHash, nonce, network.chainId);

        const param = {
            phone: phoneHash,
            account,
            signature
        };

        yield { key: NormalSteps.PREPARED, phone, phoneHash, account, signature, balance };

        const res = await Network.post(await this.getEndpoint("/v1/ledger/changeToPayablePoint"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, txHash: res.data.txHash };
        const txReceipt = await contractTx.wait();

        const exchangerContract: LoyaltyExchanger = LoyaltyExchanger__factory.connect(
            this.web3.getLoyaltyExchangerAddress(),
            signer
        );
        const log = findLog(txReceipt, exchangerContract.interface, "ChangedToPayablePoint");
        if (!log) {
            throw new FailedPayTokenError();
        }
        const parsedLog = exchangerContract.interface.parseLog(log);
        if (!balance.eq(parsedLog.args["changedPoint"])) {
            throw new AmountMismatchError(balance, parsedLog.args["changedPoint"]);
        }

        yield {
            key: NormalSteps.DONE
        };
    }

    /**
     * 사용자의 적립/사용 내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param limit
     * @param skip
     * @param sortDirection
     * @param sortBy
     */
    public async getSaveAndUseHistory(
        account: string,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryUserTradeHistory;
        const where = { account: account, pageType: LedgerPageType.SAVE_USE };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        return await this.graphql.request({ query, params, name });
    }

    /**
     * 사용자의 충전/인출 내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param limit
     * @param skip
     * @param sortDirection
     * @param sortBy
     */
    public async getDepositAndWithdrawHistory(
        account: string,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryUserTradeHistory;
        const where = { account: account, pageType: LedgerPageType.DEPOSIT_WITHDRAW };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        return await this.graphql.request({ query, params, name });
    }

    /**
     * 사용자의 이체 내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param limit
     * @param skip
     * @param sortDirection
     * @param sortBy
     */
    public async getTransferHistory(
        account: string,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        const query = QueryUserTradeHistory;
        const where = { account: account, pageType: LedgerPageType.TRANSFER };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        return await this.graphql.request({ query, params, name });
    }

    /**
     * 사용자의 내역을 제공한다.
     * @param token
     * @param language
     * @param os
     * @param type
     */
    public async registerMobileToken(
        token: string,
        language: string,
        os: string,
        type: MobileType = MobileType.USER_APP
    ): Promise<void> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const signature = await ContractUtils.signMobileToken(signer, token);
        const param = {
            account: await signer.getAddress(),
            type,
            token,
            language,
            os,
            signature
        };

        const res = await Network.post(await this.getEndpoint("/v1/mobile/register"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
    }

    /**
     * 사용가능한 포인트로 변환한다.
     * @return {AsyncGenerator<RemovePhoneInfoStepValue>}
     */
    public async *removePhoneInfo(): AsyncGenerator<RemovePhoneInfoStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await signer.provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const account = await signer.getAddress();
        const nonce = await ledgerContract.nonceOf(account);
        const message = ContractUtils.getRemoveMessage(account, nonce, network.chainId);
        const signature = await ContractUtils.signMessage(signer, message);
        let contractTx: ContractTransaction;

        const param = {
            account,
            signature
        };

        yield { key: NormalSteps.PREPARED, account, signature };

        const res = await Network.post(await this.getEndpoint("/v1/ledger/removePhoneInfo"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, txHash: res.data.txHash };
        const txReceipt = await contractTx.wait();

        const log = findLog(txReceipt, ledgerContract.interface, "RemovedPhoneInfo");
        if (!log) {
            throw new FailedRemovePhoneInfoError();
        }
        yield {
            key: NormalSteps.DONE,
            account
        };
    }

    public async getEstimatedSaveHistory(account: string): Promise<any[]> {
        const param = {
            account
        };

        const res = await Network.get(await this.getEndpoint("/v1/purchase/user/provide"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data;
    }

    public async getTotalEstimatedSaveHistory(account: string): Promise<any[]> {
        const param = {
            account
        };

        const res = await Network.get(await this.getEndpoint("/v1/purchase/user/provide/total"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data;
    }

    public async getTemporaryAccount(): Promise<string> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await signer.provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const account = await signer.getAddress();
        const nonce = await ledgerContract.nonceOf(account);
        const message = ContractUtils.getAccountMessage(account, nonce, network.chainId);
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            account,
            signature
        };

        const res = await Network.post(await this.getEndpoint("/v1/payment/account/temporary"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data.temporaryAccount;
    }

    public async getNonceOfMainChainToken(account: string): Promise<BigNumber> {
        const res = await Network.get(await this.getEndpoint(`/v1/token/main/nonce/${account}`));
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return BigNumber.from(res.data.nonce);
    }

    public async getNonceOfSideChainToken(account: string): Promise<BigNumber> {
        const res = await Network.get(await this.getEndpoint(`/v1/token/side/nonce/${account}`));
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return BigNumber.from(res.data.nonce);
    }

    public async getNonceOfLedger(account: string): Promise<BigNumber> {
        const res = await Network.get(await this.getEndpoint(`/v1/ledger/nonce/${account}`));
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return BigNumber.from(res.data.nonce);
    }

    public async getChainInfoOfMainChain(): Promise<IChainInfo> {
        if (this.mainChainInfo !== undefined) return this.mainChainInfo;
        const res = await Network.get(await this.getEndpoint(`/v1/chain/main/info`));
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
        this.mainChainInfo = {
            url: res.data.url,
            network: {
                name: res.data.network.name,
                chainId: res.data.network.chainId,
                ensAddress: res.data.network.ensAddress,
                transferFee: BigNumber.from(res.data.network.transferFee),
                bridgeFee: BigNumber.from(res.data.network.bridgeFee)
            },
            contract: {
                token: res.data.contract.token,
                chainBridge: res.data.contract.chainBridge,
                loyaltyBridge: res.data.contract.loyaltyBridge
            }
        };

        return this.mainChainInfo;
    }

    public async getChainInfoOfSideChain(): Promise<IChainInfo> {
        if (this.sideChainInfo !== undefined) return this.sideChainInfo;
        const res = await Network.get(await this.getEndpoint(`/v1/chain/side/info`));
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
        this.sideChainInfo = {
            url: res.data.url,
            network: {
                name: res.data.network.name,
                chainId: res.data.network.chainId,
                ensAddress: res.data.network.ensAddress,
                transferFee: BigNumber.from(res.data.network.transferFee),
                bridgeFee: BigNumber.from(res.data.network.bridgeFee)
            },
            contract: {
                token: res.data.contract.token,
                chainBridge: res.data.contract.chainBridge,
                loyaltyBridge: res.data.contract.loyaltyBridge
            }
        };
        return this.sideChainInfo;
    }

    public async getChainIdOfMainChain(): Promise<number> {
        const chainInfo = await this.getChainInfoOfMainChain();
        return Number(chainInfo.network.chainId);
    }

    public async getChainIdOfSideChain(): Promise<number> {
        const chainInfo = await this.getChainInfoOfSideChain();
        return Number(chainInfo.network.chainId);
    }

    public async getProviderOfMainChain(): Promise<JsonRpcProvider> {
        const chainInfo = await this.getChainInfoOfMainChain();
        const url = new URL(chainInfo.url);
        return new JsonRpcProvider(url.href, {
            name: chainInfo.network.name,
            chainId: chainInfo.network.chainId,
            ensAddress: chainInfo.network.ensAddress
        });
    }

    public async getProviderOfSideChain(): Promise<JsonRpcProvider> {
        const chainInfo = await this.getChainInfoOfSideChain();
        const url = new URL(chainInfo.url);
        return new JsonRpcProvider(url.href, {
            name: chainInfo.network.name,
            chainId: chainInfo.network.chainId,
            ensAddress: chainInfo.network.ensAddress
        });
    }

    public async getMainChainBalance(account: string): Promise<BigNumber> {
        const res = await Network.get(await this.getEndpoint(`/v1/token/main/balance/${account}`));
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
        return BigNumber.from(res.data.balance);
    }

    public async getSideChainBalance(account: string): Promise<BigNumber> {
        const res = await Network.get(await this.getEndpoint(`/v1/token/side/balance/${account}`));
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
        return BigNumber.from(res.data.balance);
    }

    /**
     * 토큰을 다른 주소로 전송한다.
     * @param to 이체할 주소
     * @param amount 금액
     * @return {AsyncGenerator<DelegatedTransferStepValue>}
     */
    public async *transfer(to: string, amount: BigNumber): AsyncGenerator<DelegatedTransferStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await signer.provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const account = await signer.getAddress();
        const adjustedAmount = ContractUtils.zeroGWEI(amount);

        let contractTx: ContractTransaction;
        const nonce = await this.getNonceOfLedger(account);
        const message = await ContractUtils.getTransferMessage(account, to, adjustedAmount, nonce, network.chainId);
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            from: account,
            to,
            amount: adjustedAmount.toString(),
            signature
        };

        yield { key: NormalSteps.PREPARED, from: account, to, amount: adjustedAmount, signature };

        const res = await Network.post(await this.getEndpoint("/v1/ledger/transfer"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, from: account, to, amount: adjustedAmount, signature, txHash: res.data.txHash };
        const txReceipt = await contractTx.wait();

        const transferContract: LoyaltyTransfer = LoyaltyTransfer__factory.connect(
            this.web3.getLoyaltyTransferAddress(),
            signer
        );
        const log = findLog(txReceipt, transferContract.interface, "TransferredLoyaltyToken");
        if (!log) {
            throw new FailedTransactionError();
        }

        yield {
            key: NormalSteps.DONE,
            from: account,
            to,
            amount: adjustedAmount,
            signature
        };
    }

    /**
     * 토큰을 브릿지를 경유해서 입금한다
     * @param amount 금액
     * @return {AsyncGenerator<DepositViaBridgeStepValue>}
     */
    public async *depositViaBridge(amount: BigNumber): AsyncGenerator<DepositViaBridgeStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const chainInfo = await this.getChainInfoOfMainChain();
        const account = await signer.getAddress();
        const adjustedAmount = ContractUtils.zeroGWEI(amount);

        const nonce = await this.getNonceOfMainChainToken(account);
        const message = await ContractUtils.getTransferMessage(
            account,
            chainInfo.contract.loyaltyBridge,
            adjustedAmount,
            nonce,
            chainInfo.network.chainId
        );
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            account,
            amount: adjustedAmount.toString(),
            signature
        };

        yield { key: NormalSteps.PREPARED, account, amount: adjustedAmount, signature };

        const res = await Network.post(await this.getEndpoint("/v1/ledger/deposit_via_bridge"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        yield {
            key: NormalSteps.SENT,
            account,
            amount: adjustedAmount,
            signature,
            tokenId: res.data.tokenId,
            depositId: res.data.depositId,
            txHash: res.data.txHash
        };

        const provider = await this.getProviderOfMainChain();

        const contractTx = (await provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await contractTx.wait();

        const bridgeContract: IBridge = IBridge__factory.connect(chainInfo.contract.loyaltyBridge, provider);

        const log = findLog(txReceipt, bridgeContract.interface, "BridgeDeposited");
        if (!log) {
            throw new FailedTransactionError();
        }

        yield {
            key: NormalSteps.DONE,
            account,
            tokenId: res.data.tokenId,
            depositId: res.data.depositId,
            amount: adjustedAmount,
            signature
        };
    }

    public async *waiteDepositViaBridge(depositId: string, timeout: number = 30): AsyncGenerator<WaiteBridgeStepValue> {
        const chainInfo = await this.getChainInfoOfSideChain();
        const provider = await this.getProviderOfSideChain();
        const bridgeContract: IBridge = IBridge__factory.connect(chainInfo.contract.loyaltyBridge, provider);

        const start = ContractUtils.getTimeStamp();
        while (true) {
            const withdrawInfo = await bridgeContract.getWithdrawInfo(depositId);
            if (withdrawInfo.account !== AddressZero) {
                yield {
                    key: WaiteBridgeSteps.CREATED,
                    account: withdrawInfo.account,
                    amount: withdrawInfo.amount,
                    tokenId: withdrawInfo.tokenId
                };
                break;
            }
            if (ContractUtils.getTimeStamp() - start > timeout) {
                yield { key: WaiteBridgeSteps.TIMEOUT };
                return;
            }
            await ContractUtils.delay(1000);
        }

        while (true) {
            const withdrawInfo = await bridgeContract.getWithdrawInfo(depositId);
            if (withdrawInfo.executed) {
                yield {
                    key: WaiteBridgeSteps.EXECUTED,
                    account: withdrawInfo.account,
                    amount: withdrawInfo.amount,
                    tokenId: withdrawInfo.tokenId
                };
                break;
            }
            if (ContractUtils.getTimeStamp() - start > timeout) {
                yield { key: WaiteBridgeSteps.TIMEOUT };
                return;
            }
            await ContractUtils.delay(1000);
        }
        await ContractUtils.delay(1000);
        yield { key: WaiteBridgeSteps.DONE };
    }

    /**
     * 토큰을 브릿지를 경유해서 출금한다
     * @param amount 금액
     * @return {AsyncGenerator<DepositViaBridgeStepValue>}
     */
    public async *withdrawViaBridge(amount: BigNumber): AsyncGenerator<DepositViaBridgeStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const chainInfo = await this.getChainInfoOfSideChain();
        const account = await signer.getAddress();
        const adjustedAmount = ContractUtils.zeroGWEI(amount);

        const nonce = await this.getNonceOfLedger(account);
        const message = await ContractUtils.getTransferMessage(
            account,
            chainInfo.contract.loyaltyBridge,
            adjustedAmount,
            nonce,
            chainInfo.network.chainId
        );
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            account,
            amount: adjustedAmount.toString(),
            signature
        };

        yield { key: NormalSteps.PREPARED, account, amount: adjustedAmount, signature };

        const res = await Network.post(await this.getEndpoint("/v1/ledger/withdraw_via_bridge"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        yield {
            key: NormalSteps.SENT,
            account,
            amount: adjustedAmount,
            signature,
            tokenId: res.data.tokenId,
            depositId: res.data.depositId,
            txHash: res.data.txHash
        };
        const provider = await this.getProviderOfSideChain();
        const contractTx = (await provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await contractTx.wait();

        const bridgeContract: IBridge = IBridge__factory.connect(chainInfo.contract.loyaltyBridge, provider);

        const log = findLog(txReceipt, bridgeContract.interface, "BridgeDeposited");
        if (!log) {
            throw new FailedTransactionError();
        }

        yield {
            key: NormalSteps.DONE,
            account,
            tokenId: res.data.tokenId,
            depositId: res.data.depositId,
            amount: adjustedAmount,
            signature
        };
    }

    public async *waiteWithdrawViaBridge(
        depositId: string,
        timeout: number = 30
    ): AsyncGenerator<WaiteBridgeStepValue> {
        const chainInfo = await this.getChainInfoOfMainChain();
        const provider = await this.getProviderOfMainChain();
        const bridgeContract: IBridge = IBridge__factory.connect(chainInfo.contract.loyaltyBridge, provider);

        const start = ContractUtils.getTimeStamp();
        while (true) {
            const withdrawInfo = await bridgeContract.getWithdrawInfo(depositId);
            if (withdrawInfo.account !== AddressZero) {
                yield {
                    key: WaiteBridgeSteps.CREATED,
                    account: withdrawInfo.account,
                    amount: withdrawInfo.amount,
                    tokenId: withdrawInfo.tokenId
                };
                break;
            }
            if (ContractUtils.getTimeStamp() - start > timeout) {
                yield { key: WaiteBridgeSteps.TIMEOUT };
                return;
            }
            await ContractUtils.delay(1000);
        }

        while (true) {
            const withdrawInfo = await bridgeContract.getWithdrawInfo(depositId);
            if (withdrawInfo.executed) {
                yield {
                    key: WaiteBridgeSteps.EXECUTED,
                    account: withdrawInfo.account,
                    amount: withdrawInfo.amount,
                    tokenId: withdrawInfo.tokenId
                };
                break;
            }
            if (ContractUtils.getTimeStamp() - start > timeout) {
                yield { key: WaiteBridgeSteps.TIMEOUT };
                return;
            }
            await ContractUtils.delay(1000);
        }
        const block1 = await provider.getBlock("latest");
        while (true) {
            const block2 = await provider.getBlock("latest");
            if (block2.number > block1.number) break;
            if (ContractUtils.getTimeStamp() - start > timeout) {
                yield { key: WaiteBridgeSteps.TIMEOUT };
                return;
            }
            await ContractUtils.delay(1000);
        }
        yield { key: WaiteBridgeSteps.DONE };
    }
}
