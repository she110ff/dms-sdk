import {
    ClientCore,
    Context,
    findLog,
    IClientHttpCore,
    SupportedNetwork,
    SupportedNetworkArray
} from "../../client-common";
import { PhoneLinkCollection, PhoneLinkCollection__factory } from "del-osx-lib";
import { NoProviderError, NoSignerError, UnsupportedNetworkError } from "dms-sdk-common";
import {
    NormalSteps,
    PhoneLinkRegisterSteps,
    PhoneLinkRegisterStepValue,
    PhoneLinkRequestStatus,
    PhoneLinkSubmitSteps,
    PhoneLinkSubmitStepValue,
    RemovePhoneInfoStepValue
} from "../../interfaces";
import { ContractUtils } from "../../utils/ContractUtils";
import { getNetwork } from "../../utils/Utilty";

import { IPhoneLinkMethods } from "../../interface/IPhoneLink";
import { Network } from "../../client-common/interfaces/network";

import { BytesLike } from "@ethersproject/bytes";

import { FailedRemovePhoneInfoError, InternalServerError, NoValidator } from "../../utils/errors";
import { ContractTransaction } from "@ethersproject/contracts";

/**
 * 사용자의 전화번화와 지갑주소를 링크하여 스마트컨트랙트에 저장하는 기능이 포함되어 있다.
 */
export class PhoneLinkMethods extends ClientCore implements IPhoneLinkMethods, IClientHttpCore {
    constructor(context: Context) {
        super(context);

        Object.freeze(PhoneLinkMethods.prototype);
        Object.freeze(this);
    }

    /**
     * 검증자가 정상적인 상태인지 검사한다.
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
     * 검증자의 주소를 이용하여 엔드포인트를 생성한다
     * @param path 경로
     * @return {Promise<URL>} 엔드포인트의 주소
     */
    public async getEndpoint(path: string): Promise<URL> {
        if (!path) throw Error("Not path");
        const newUrl = await this.getValidatorEndpoint();
        if (newUrl && !newUrl?.pathname.endsWith("/")) {
            newUrl.pathname += "/";
        }
        return new URL(path, newUrl);
    }

    private async getValidatorEndpoint(): Promise<URL> {
        const provider = this.web3.getProvider();
        if (!provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const contract = PhoneLinkCollection__factory.connect(this.web3.getLinkAddress(), provider);
        const validators = await contract.getValidators();
        if (validators.length === 0) {
            throw new NoValidator();
        }
        const idx = Math.floor(Math.random() * validators.length);
        return new URL(validators[idx].endpoint);
    }

    /**
     * Register phone & address
     *
     * @param {phone} phone
     * @return {*}  {AsyncGenerator<PhoneLinkRegisterStepValue>}
     * @memberof ClientMethods
     */
    public async *register(phone: string): AsyncGenerator<PhoneLinkRegisterStepValue> {
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

        const contract = PhoneLinkCollection__factory.connect(this.web3.getLinkAddress(), signer);
        const address = await signer.getAddress();
        const nonce = await contract.nonceOf(address);
        const phoneHash = ContractUtils.getPhoneHash(phone);
        const msg = ContractUtils.getRequestMessage(phoneHash, address, nonce, network.chainId);
        const signature = await ContractUtils.signMessage(signer, msg);
        const param = { phone, address, signature };
        const res = await Network.post(await this.getEndpoint("/request"), param);

        if (res.code !== 200) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        yield {
            key: PhoneLinkRegisterSteps.SENDING,
            requestId: res.data.requestId,
            phone,
            address
        };

        const start = ContractUtils.getTimeStamp();
        let done = false;
        let status: PhoneLinkRequestStatus = 0;
        while (!done) {
            status = await this.getRegisterStatus(res.data.requestId);
            if (status !== PhoneLinkRequestStatus.INVALID) {
                done = true;
            } else if (ContractUtils.getTimeStamp() - start > 60) {
                done = true;
            } else {
                await ContractUtils.delay(2000);
            }
        }

        let key: PhoneLinkRegisterSteps;
        switch (status) {
            case PhoneLinkRequestStatus.INVALID:
                key = PhoneLinkRegisterSteps.TIMEOUT;
                break;
            case PhoneLinkRequestStatus.REQUESTED:
                key = PhoneLinkRegisterSteps.REQUESTED;
                break;
            case PhoneLinkRequestStatus.ACCEPTED:
                key = PhoneLinkRegisterSteps.REQUESTED;
                break;
            default:
                key = PhoneLinkRegisterSteps.TIMEOUT;
                break;
        }

        yield {
            key,
            requestId: res.data.requestId,
            phone,
            address
        };
    }

    /**
     * Submit authentication code
     *
     * @param requestId Request ID
     * @param code Authentication code
     * @return {*}  {AsyncGenerator<PhoneLinkSubmitStepValue>}
     * @memberof ClientMethods
     */
    public async *submit(requestId: BytesLike, code: string): AsyncGenerator<PhoneLinkSubmitStepValue> {
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

        const param = { requestId, code };
        const res = await Network.post(await this.getEndpoint("/submit"), param);

        if (res.code !== 200) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        yield {
            key: PhoneLinkSubmitSteps.SENDING,
            requestId,
            code
        };

        const start = ContractUtils.getTimeStamp();
        let done = false;
        let status = PhoneLinkRequestStatus.INVALID;
        while (!done) {
            status = await this.getRegisterStatus(requestId);
            if (status === PhoneLinkRequestStatus.ACCEPTED) {
                done = true;
            } else if (ContractUtils.getTimeStamp() - start > 60) {
                done = true;
            } else {
                await ContractUtils.delay(2000);
            }
        }

        let key: PhoneLinkSubmitSteps;
        switch (status) {
            case PhoneLinkRequestStatus.INVALID:
                key = PhoneLinkSubmitSteps.TIMEOUT;
                break;
            case PhoneLinkRequestStatus.REQUESTED:
                key = PhoneLinkSubmitSteps.TIMEOUT;
                break;
            case PhoneLinkRequestStatus.ACCEPTED:
                key = PhoneLinkSubmitSteps.ACCEPTED;
                break;
            default:
                key = PhoneLinkSubmitSteps.TIMEOUT;
                break;
        }

        yield {
            key,
            requestId: requestId
        };
    }

    public async toAddress(phone: string): Promise<string> {
        const provider = this.web3.getProvider();
        if (!provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const contract = PhoneLinkCollection__factory.connect(this.web3.getLinkAddress(), provider);

        return await contract.toAddress(phone);
    }

    public async toPhoneNumber(address: string): Promise<string> {
        const provider = this.web3.getProvider();
        if (!provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const contract = PhoneLinkCollection__factory.connect(this.web3.getLinkAddress(), provider);

        return await contract.toPhone(address);
    }

    public async getRegisterStatus(id: BytesLike): Promise<PhoneLinkRequestStatus> {
        const provider = this.web3.getProvider();
        if (!provider) {
            throw new NoProviderError();
        }

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const contract = PhoneLinkCollection__factory.connect(this.web3.getLinkAddress(), provider);
        const res = await contract.getRequestItem(id);
        return res.status;
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

        const contract: PhoneLinkCollection = PhoneLinkCollection__factory.connect(
            this.web3.getLedgerAddress(),
            signer
        );

        const account = await signer.getAddress();
        const nonce = await contract.nonceOf(account);
        const message = ContractUtils.getRemoveMessage(account, nonce, network.chainId);
        const signature = await ContractUtils.signMessage(signer, message);
        let contractTx: ContractTransaction;

        const param = {
            account,
            signature
        };

        yield { key: NormalSteps.PREPARED, account, signature };

        const res = await Network.post(await this.getEndpoint("/v1/link/removePhoneInfo"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, txHash: res.data.txHash };
        const txReceipt = await contractTx.wait();

        const log = findLog(txReceipt, contract.interface, "RemovedItem");
        if (!log) {
            throw new FailedRemovePhoneInfoError();
        }
        yield {
            key: NormalSteps.DONE,
            account
        };
    }
}
