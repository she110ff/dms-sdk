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
    DepositSteps,
    DepositStepValue,
    ExchangeMileageToTokenOption,
    ExchangeTokenToMileageOption,
    FetchPayOption,
    PayMileageOption,
    PayMileageSteps,
    PayMileageStepValue,
    PayTokenOption,
    PayTokenSteps,
    PayTokenStepValue,
    QueryOption,
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
    FailedPayMileageError,
    FailedPayTokenError,
    FailedWithdrawError,
    InsufficientBalanceError,
    InternalServerError,
    InvalidEmailParamError,
    MismatchApproveAddressError,
    NoHttpModuleError,
    UnregisteredEmailError
} from "../../utils/errors";
import { checkEmail } from "../../utils";
import { LinkCollection, LinkCollection__factory } from "del-osx-lib";
import { Network } from "../../client-common/interfaces/network";
import { findLog } from "../../client-common/utils";

import { BigNumber } from "@ethersproject/bignumber";
import { AddressZero } from "@ethersproject/constants";
import { ContractTransaction } from "@ethersproject/contracts";
import { getNetwork } from "@ethersproject/networks";
import { QueryUserTradeHistory } from "../graphql-queries/history";

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
     * 마일리지의 잔고를 리턴한다
     * @param {string} email - 이메일 주소
     * @return {Promise<BigNumber>} 마일리지 잔고
     */
    public async getMileageBalances(email: string): Promise<BigNumber> {
        if (!checkEmail(email)) throw new InvalidEmailParamError();

        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);
        const emailHash = ContractUtils.sha256String(email);

        return await ledgerInstance.mileageBalanceOf(emailHash);
    }

    /**
     * 토큰의 잔고를 리턴한다.
     * @param {string} email - 이메일
     * @return {Promise<BigNumber>} 토큰 잔고
     */
    public async getTokenBalances(email: string): Promise<BigNumber> {
        if (!checkEmail(email)) throw new InvalidEmailParamError();

        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);
        const emailHash = ContractUtils.sha256String(email);

        return await ledgerInstance.tokenBalanceOf(emailHash);
    }

    /**
     * 마일리지 사용승인 하여 Relay 서버로 전송하기 위한 서명값을 생성한다.
     * @param purchaseId - 거래 아이디
     * @param amount - 거래금액
     * @param email - 사용자 이메일 주소
     * @param franchiseeId - 거래처 아이디
     * @return {Promise<PayMileageOption>}
     */
    public async getPayMileageOption(
        purchaseId: string,
        amount: BigNumber,
        email: string,
        franchiseeId: string
    ): Promise<PayMileageOption> {
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

        const emailHash = ContractUtils.sha256String(email);
        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const linkContract: LinkCollection = LinkCollection__factory.connect(
            this.web3.getLinkCollectionAddress(),
            signer
        );

        const emailToAddress: string = await linkContract.toAddress(emailHash);
        if (emailToAddress === AddressZero) throw new UnregisteredEmailError();

        const signerAddress: string = await signer.getAddress();
        if (emailToAddress !== signerAddress) throw new MismatchApproveAddressError();

        const nonce = await ledgerContract.nonceOf(emailToAddress);
        const signature = await ContractUtils.signPayment(signer, purchaseId, amount, emailHash, franchiseeId, nonce);

        const relayParam: FetchPayOption = {
            purchaseId,
            amount: amount.toString(),
            email: emailHash,
            franchiseeId,
            signer: signerAddress,
            signature
        };
        return Promise.resolve(relayParam);
    }

    /**
     * 토큰 사용승인 하여 Relay 서버로 전송하기 위한 서명값을 생성한다.
     * @param purchaseId - 거래 아이디
     * @param amount - 거래금액
     * @param email - 사용자 이메일 주소
     * @param franchiseeId - 거래처 아이디
     * @return {Promise<PayTokenOption>}
     */
    public async getPayTokenOption(
        purchaseId: string,
        amount: BigNumber,
        email: string,
        franchiseeId: string
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

        const emailHash = ContractUtils.sha256String(email);
        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const linkContract: LinkCollection = LinkCollection__factory.connect(
            this.web3.getLinkCollectionAddress(),
            signer
        );

        const emailToAddress: string = await linkContract.toAddress(emailHash);
        if (emailToAddress === AddressZero) throw new UnregisteredEmailError();

        const signerAddress: string = await signer.getAddress();
        if (emailToAddress !== signerAddress) throw new MismatchApproveAddressError();

        const nonce = await ledgerContract.nonceOf(emailToAddress);
        const signature = await ContractUtils.signPayment(signer, purchaseId, amount, emailHash, franchiseeId, nonce);

        const relayParam: FetchPayOption = {
            purchaseId,
            amount: amount.toString(),
            email: emailHash,
            franchiseeId,
            signer: signerAddress,
            signature
        };
        return Promise.resolve(relayParam);
    }

    /**
     * 토큰을 마일리지로 전환 하기위한 서명값을 생성한다.
     * @param {string} email - 이메일주소
     * @param {number} amount - 거래금액
     * @return {Promise<ExchangeTokenToMileageOption>}
     */
    public async getTokenToMileageOption(email: string, amount: BigNumber): Promise<ExchangeTokenToMileageOption> {
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

        const emailHash = ContractUtils.sha256String(email);
        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const linkContract: LinkCollection = LinkCollection__factory.connect(
            this.web3.getLinkCollectionAddress(),
            signer
        );

        const emailToAddress: string = await linkContract.toAddress(emailHash);
        if (emailToAddress === AddressZero) throw new UnregisteredEmailError();

        const signerAddress: string = await signer.getAddress();
        if (emailToAddress !== signerAddress) throw new MismatchApproveAddressError();

        const nonce: BigNumber = await ledgerContract.nonceOf(emailToAddress);
        const signature: string = await ContractUtils.signExchange(signer, emailHash, amount, nonce);

        return {
            email: emailHash,
            amountToken: amount.toString(),
            signer: signerAddress,
            signature
        };
    }

    /**
     * 마일리지를 토큰으로 전환 하기위한 서명값을 생성한다.
     * @param {string} email - 이메일주소
     * @param {number} amount - 거래금액
     * @return {Promise<ExchangeMileageToTokenOption>}
     */
    public async getMileageToTokenOption(email: string, amount: BigNumber): Promise<ExchangeMileageToTokenOption> {
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

        const emailHash = ContractUtils.sha256String(email);
        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const linkContract: LinkCollection = LinkCollection__factory.connect(
            this.web3.getLinkCollectionAddress(),
            signer
        );

        const emailToAddress: string = await linkContract.toAddress(emailHash);
        if (emailToAddress === AddressZero) throw new UnregisteredEmailError();

        const signerAddress: string = await signer.getAddress();
        if (emailToAddress !== signerAddress) throw new MismatchApproveAddressError();

        const nonce: BigNumber = await ledgerContract.nonceOf(emailToAddress);
        const signature: string = await ContractUtils.signExchange(signer, emailHash, amount, nonce);

        return {
            email: emailHash,
            amountMileage: amount.toString(),
            signer: signerAddress,
            signature
        };
    }

    /**
     * 토큰을 예치합니다.
     * @param {string} email 이메일주소
     * @param {BigNumber} amount 금액
     * @return {AsyncGenerator<DepositStepValue>}
     */
    public async *deposit(email: string, amount: BigNumber): AsyncGenerator<DepositStepValue> {
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

        const emailHash = ContractUtils.sha256String(email);
        const linkContract: LinkCollection = LinkCollection__factory.connect(
            this.web3.getLinkCollectionAddress(),
            signer
        );

        const emailToAddress: string = await linkContract.toAddress(emailHash);
        if (emailToAddress === AddressZero) throw new UnregisteredEmailError();

        const signerAddress: string = await signer.getAddress();
        if (emailToAddress !== signerAddress) throw new MismatchApproveAddressError();

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const tokenContract: Token = Token__factory.connect(this.web3.getTokenAddress(), signer);

        const balance = await tokenContract.balanceOf(signerAddress);
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
     * @param {string} email 이메일주소
     * @param {BigNumber} amount 금액
     * @return {AsyncGenerator<WithdrawStepValue>}
     */
    public async *withdraw(email: string, amount: BigNumber): AsyncGenerator<WithdrawStepValue> {
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

        const emailHash = ContractUtils.sha256String(email);
        const linkContract: LinkCollection = LinkCollection__factory.connect(
            this.web3.getLinkCollectionAddress(),
            signer
        );

        const emailToAddress: string = await linkContract.toAddress(emailHash);
        if (emailToAddress === AddressZero) throw new UnregisteredEmailError();

        const signerAddress: string = await signer.getAddress();
        if (emailToAddress !== signerAddress) throw new MismatchApproveAddressError();

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const currentDepositAmount = await ledgerContract.tokenBalanceOf(emailHash);
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

    public async *fetchPayMileage(param: FetchPayOption): AsyncGenerator<PayMileageStepValue> {
        const provider = this.web3.getProvider();
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const res = await Network.post(await this.getEndpoint("payMileage"), param);
        if (res?.code !== 200) throw new InternalServerError(res.message);
        if (res?.data?.code && res.data.code !== 200) throw new InternalServerError(res?.data?.error?.message ?? "");

        yield { key: PayMileageSteps.PAYING_MILEAGE, txHash: res.data.txHash };

        const txResponse = (await provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await txResponse.wait();
        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);

        const log = findLog(txReceipt, ledgerContract.interface, "PaidMileage");
        if (!log) {
            throw new FailedPayMileageError();
        }
        const amount = BigNumber.from(param.amount);
        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!amount.eq(parsedLog.args["value"])) {
            throw new AmountMismatchError(amount, parsedLog.args["value"]);
        }
        yield {
            key: PayMileageSteps.DONE,
            amount: amount,
            paidAmountMileage: parsedLog.args["paidAmountMileage"],
            balanceMileage: parsedLog.args["balanceMileage"]
        };
    }

    public async *fetchPayToken(param: FetchPayOption): AsyncGenerator<PayTokenStepValue> {
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

        yield { key: PayTokenSteps.PAYING_TOKEN, txHash: res.data.txHash };

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
            amount: amount,
            paidAmountToken: parsedLog.args["paidAmountToken"],
            balanceToken: parsedLog.args["balanceToken"]
        };
    }

    public async fetchExchangeMileageToToken(param: ExchangeMileageToTokenOption): Promise<any> {
        return Network.post(await this.getEndpoint("exchangeMileageToToken"), param);
    }

    public async fetchExchangeTokenToMileage(param: ExchangeTokenToMileageOption): Promise<any> {
        return Network.post(await this.getEndpoint("exchangeTokenToMileage"), param);
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

    public async getUserTradeHistory(
        email: string,
        { limit, skip, sortDirection, sortBy }: QueryOption = {
            limit: 10,
            skip: 0,
            sortDirection: SortDirection.DESC,
            sortBy: SortByBlock.BLOCK_NUMBER
        }
    ): Promise<any> {
        if (!checkEmail(email)) throw new InvalidEmailParamError();
        const emailHash = ContractUtils.sha256String(email);
        const query = QueryUserTradeHistory;
        const where = { email: emailHash };
        const params = { where, limit, skip, direction: sortDirection, sortBy };
        const name = "user trade history";
        const res = await this.graphql.request({ query, params, name });
        return res;
    }
}
