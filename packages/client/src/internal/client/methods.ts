import { ClientCore, Context, LIVE_CONTRACTS, SupportedNetworks, SupportedNetworksArray } from "../../client-common";
import { IClientMethods } from "../../interface/IClient";
import { Ledger, Ledger__factory } from "dms-osx-lib";
import { UnsupportedNetworkError } from "dms-sdk-common";
import { Provider } from "@ethersproject/providers";
import { ContractUtils } from "../../utils/ContractUtils";
import { checkEmail } from "../../utils";
import { BalanceOfMileageParam } from "../../interfaces";
import { InvalidEmailParamError } from "../../utils/error";
import { BigNumber } from "ethers";

/**
 * Methods module the SDK Generic Client
 */
export class ClientMethods extends ClientCore implements IClientMethods {
    constructor(context: Context) {
        super(context);
        Object.freeze(ClientMethods.prototype);
        Object.freeze(this);
    }
    public async getMileageBalances({ email }: BalanceOfMileageParam): Promise<BigNumber> {
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

    public async getTokenBalances(params: any): Promise<any> {
        //TODO : 토큰 조회 기능 추가
        return params;
    }

    public async payMileage(params: any): Promise<any> {
        //TODO : 마일리지 사용 승인 기능 추가
        return params;
    }

    public async payToken(params: any): Promise<any> {
        //TODO : 토큰 사용 승인 기능 추가
        return params;
    }

    public async tokenToMileage(params: any): Promise<any> {
        //TODO : 토큰을 마일리지로 전환 기능 추가
        return params;
    }

    public async mileageToToken(params: any): Promise<any> {
        //TODO : 마일리지를 토큰으로 전환 기능 추가
        return params;
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
