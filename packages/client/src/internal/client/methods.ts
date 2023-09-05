import { ClientCore, Context, LIVE_CONTRACTS, SupportedNetworks, SupportedNetworksArray } from "../../client-common";
import { IClientMethods } from "../../interface/IClient";
import { Ledger, Ledger__factory } from "dms-osx-lib";
import { UnsupportedNetworkError } from "dms-sdk-common";
import { Provider } from "@ethersproject/providers";
import { ContractUtils } from "../../utils/ContractUtils";
import {
    BalanceParam,
    ExchangeTokenToMileageParams,
    ExchangeTokenToMileageOption,
    FetchPayOption,
    PayMileageOption,
    PayMileageParams,
    PayTokenOption,
    PayTokenParams,
    ExchangeMileageToTokenOption
} from "../../interfaces";
import { InvalidEmailParamError, MismatchApproveAddressError } from "../../utils/errors";
import { BigNumber } from "ethers";
import { checkEmail } from "../../utils";
import { Amount } from "../../utils/Amount";
import { LinkCollection, LinkCollection__factory } from "del-osx-lib";

/**
 * Methods module the SDK Generic Client
 */
export class ClientMethods extends ClientCore implements IClientMethods {
    constructor(context: Context) {
        super(context);
        Object.freeze(ClientMethods.prototype);
        Object.freeze(this);
    }

    /**
     * 마일리지의 잔고를 리턴한다
     * @param {BalanceParam} email - 이메일 주소
     * @return {Promise<BigNumber>} 마일리지 잔고
     */
    public async getMileageBalances({ email }: BalanceParam): Promise<BigNumber> {
        if (!checkEmail(email)) throw new InvalidEmailParamError();

        const provider = this.web3.getProvider() as Provider;
        const network = await provider.getNetwork();
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerInstance: Ledger = Ledger__factory.connect(LIVE_CONTRACTS[networkName].Ledger, provider);
        const emailHash = ContractUtils.sha256String(email);

        return await ledgerInstance.mileageBalanceOf(emailHash);
    }

    /**
     * 토큰의 잔고를 리턴한다.
     * @param {BalanceParam} email - 이메일
     * @return {Promise<BigNumber>} 토큰 잔고
     */
    public async getTokenBalances({ email }: BalanceParam): Promise<BigNumber> {
        if (!checkEmail(email)) throw new InvalidEmailParamError();

        const provider = this.web3.getProvider() as Provider;
        const network = await provider.getNetwork();
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const ledgerInstance: Ledger = Ledger__factory.connect(LIVE_CONTRACTS[networkName].Ledger, provider);
        const emailHash = ContractUtils.sha256String(email);

        return await ledgerInstance.tokenBalanceOf(emailHash);
    }

    /**
     * 마일리지 사용승인 하여 Relay 서버로 전송하기 위한 서명값을 생성한다.
     * @param signer - Signer
     * @param purchaseId - 거래 아이디
     * @param purchaseAmount - 거래 금액
     * @param email - 사용자 이메일 주소
     * @param franchiseeId - 거래처 아이디
     * @return {Promise<RelayPayMileageOption>}
     */
    public async getPayMileageOption({
        signer,
        purchaseId,
        purchaseAmount,
        email,
        franchiseeId
    }: PayMileageParams): Promise<PayMileageOption> {
        const provider = this.web3.getProvider() as Provider;
        const network = await provider.getNetwork();
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const emailHash = ContractUtils.sha256String(email);
        const ledgerContract: Ledger = Ledger__factory.connect(LIVE_CONTRACTS[networkName].Ledger, provider);
        const linkContract: LinkCollection = LinkCollection__factory.connect(
            LIVE_CONTRACTS[networkName].LinkCollection,
            provider
        );

        const emailToAddress = await linkContract.toAddress(emailHash);
        const signerAddress = await signer.getAddress();

        if (emailToAddress !== signerAddress) {
            throw new MismatchApproveAddressError();
        }

        const nonce = await ledgerContract.nonceOf(emailToAddress);
        const amount = Amount.make(purchaseAmount, 18).value;
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
     * @param signer - Signer
     * @param purchaseId - 거래 아이디
     * @param purchaseAmount - 거래 금액
     * @param email - 사용자 이메일 주소
     * @param franchiseeId - 거래처 아이디
     * @return {Promise<PayTokenOption>}
     */
    public async getPayTokenOption({
        signer,
        purchaseId,
        purchaseAmount,
        email,
        franchiseeId
    }: PayTokenParams): Promise<PayTokenOption> {
        const provider = this.web3.getProvider() as Provider;
        const network = await provider.getNetwork();
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const emailHash = ContractUtils.sha256String(email);
        const ledgerContract: Ledger = Ledger__factory.connect(LIVE_CONTRACTS[networkName].Ledger, provider);
        const linkContract: LinkCollection = LinkCollection__factory.connect(
            LIVE_CONTRACTS[networkName].LinkCollection,
            provider
        );

        const emailToAddress = await linkContract.toAddress(emailHash);
        const signerAddress = await signer.getAddress();

        if (emailToAddress !== signerAddress) {
            throw new MismatchApproveAddressError();
        }

        const nonce = await ledgerContract.nonceOf(emailToAddress);
        const amount = Amount.make(purchaseAmount, 18).value;
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

    public async getTokenToMileageOption({
        signer,
        email,
        amount
    }: ExchangeTokenToMileageParams): Promise<ExchangeTokenToMileageOption> {
        const provider = this.web3.getProvider() as Provider;
        const network = await provider.getNetwork();
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const emailHash = ContractUtils.sha256String(email);
        const ledgerContract: Ledger = Ledger__factory.connect(LIVE_CONTRACTS[networkName].Ledger, provider);
        const linkContract: LinkCollection = LinkCollection__factory.connect(
            LIVE_CONTRACTS[networkName].LinkCollection,
            provider
        );

        const emailToAddress: string = await linkContract.toAddress(emailHash);
        const signerAddress: string = await signer.getAddress();

        if (emailToAddress !== signerAddress) {
            throw new MismatchApproveAddressError();
        }
        const amountToken: BigNumber = Amount.make(amount, 18).value;
        const nonce: BigNumber = await ledgerContract.nonceOf(emailToAddress);
        const signature: string = await ContractUtils.signExchange(signer, emailHash, amountToken, nonce);

        return {
            email: emailHash,
            amountToken: amountToken.toString(),
            signer: signerAddress,
            signature
        };
    }

    public async getMileageToTokenOption({
        signer,
        email,
        amount
    }: ExchangeTokenToMileageParams): Promise<ExchangeMileageToTokenOption> {
        const provider = this.web3.getProvider() as Provider;
        const network = await provider.getNetwork();
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const emailHash = ContractUtils.sha256String(email);
        const ledgerContract: Ledger = Ledger__factory.connect(LIVE_CONTRACTS[networkName].Ledger, provider);
        const linkContract: LinkCollection = LinkCollection__factory.connect(
            LIVE_CONTRACTS[networkName].LinkCollection,
            provider
        );

        const emailToAddress: string = await linkContract.toAddress(emailHash);
        const signerAddress: string = await signer.getAddress();

        if (emailToAddress !== signerAddress) {
            throw new MismatchApproveAddressError();
        }
        const amountMileage: BigNumber = Amount.make(amount, 18).value;
        const nonce: BigNumber = await ledgerContract.nonceOf(emailToAddress);
        const signature: string = await ContractUtils.signExchange(signer, emailHash, amountMileage, nonce);

        return {
            email: emailHash,
            amountMileage: amountMileage.toString(),
            signer: signerAddress,
            signature
        };
    }

    public async deposit(params: any): Promise<any> {
        //TODO : 토큰 입금
        return params;
    }

    public async withdraw(params: any): Promise<any> {
        //TODO : 토큰 출금
        return params;
    }
}
