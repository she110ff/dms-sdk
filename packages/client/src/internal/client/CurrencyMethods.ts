import { ClientCore, Context, SupportedNetworks, SupportedNetworksArray } from "../../client-common";
import { ICurrencyMethods } from "../../interface/ICurrency";
import { CurrencyRate, CurrencyRate__factory, Token, Token__factory } from "dms-osx-lib";
import { Provider } from "@ethersproject/providers";
import { NoProviderError, UnsupportedNetworkError } from "dms-sdk-common";
import { BigNumber } from "@ethersproject/bignumber";
import { getNetwork } from "@ethersproject/networks";

/**
 * Methods module the SDK Generic Client
 */
export class CurrencyMethods extends ClientCore implements ICurrencyMethods {
    constructor(context: Context) {
        super(context);
        Object.freeze(CurrencyMethods.prototype);
        Object.freeze(this);
    }

    /**
     * KRW 에 대한 환률정보를 제공한다
     * @param currency 통화코드
     */
    public async getRate(currency: string): Promise<BigNumber> {
        if (currency === "krw") {
            return this.getMultiple();
        } else {
            const provider = this.web3.getProvider() as Provider;
            if (!provider) throw new NoProviderError();

            const network = getNetwork((await provider.getNetwork()).chainId);
            const networkName = network.name as SupportedNetworks;
            if (!SupportedNetworksArray.includes(networkName)) {
                throw new UnsupportedNetworkError(networkName);
            }

            const contract: CurrencyRate = CurrencyRate__factory.connect(this.web3.getCurrencyRateAddress(), provider);

            return await contract.get(currency);
        }
    }

    private _CurrencyMultiple: BigNumber = BigNumber.from(0);
    public async getMultiple(): Promise<BigNumber> {
        if (!this._CurrencyMultiple.eq(BigNumber.from(0))) {
            return this._CurrencyMultiple;
        } else {
            const provider = this.web3.getProvider() as Provider;
            if (!provider) throw new NoProviderError();

            const network = getNetwork((await provider.getNetwork()).chainId);
            const networkName = network.name as SupportedNetworks;
            if (!SupportedNetworksArray.includes(networkName)) {
                throw new UnsupportedNetworkError(networkName);
            }

            const contract: CurrencyRate = CurrencyRate__factory.connect(this.web3.getCurrencyRateAddress(), provider);

            return await contract.MULTIPLE();
        }
    }

    /**
     * 포인트를 토큰의 량으로 환산한다.
     * @param amount 포인트 량
     */
    public async toToken(amount: BigNumber): Promise<BigNumber> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const network = getNetwork((await provider.getNetwork()).chainId);
        const networkName = network.name as SupportedNetworks;
        if (!SupportedNetworksArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        const tokenContract: Token = Token__factory.connect(this.web3.getTokenAddress(), provider);
        const symbol = await tokenContract.symbol();
        const currencyRateContract: CurrencyRate = CurrencyRate__factory.connect(
            this.web3.getCurrencyRateAddress(),
            provider
        );
        const rate = await currencyRateContract.get(symbol);
        const multiple = await this.getMultiple();
        return amount.mul(multiple).div(rate);
    }

    /**
     * 법정화폐 또는 토큰을 포인트로 변경한다.
     * 포인트는 KRW 로 되어 있다.
     * @param amount  currency 가 존재하면 법정화폐의 량이고, 그렇지 않으면 토큰의 량이다.
     * @param currency 이값이 존재하면 법정화폐로 처리한다. 그렇지 않은면 토큰으로 인식한다
     */
    public async toPoint(amount: BigNumber, currency?: string): Promise<BigNumber> {
        if (currency === undefined) {
            const provider = this.web3.getProvider() as Provider;
            if (!provider) throw new NoProviderError();

            const network = getNetwork((await provider.getNetwork()).chainId);
            const networkName = network.name as SupportedNetworks;
            if (!SupportedNetworksArray.includes(networkName)) {
                throw new UnsupportedNetworkError(networkName);
            }

            const tokenContract: Token = Token__factory.connect(this.web3.getTokenAddress(), provider);
            const symbol = await tokenContract.symbol();
            const currencyRateContract: CurrencyRate = CurrencyRate__factory.connect(
                this.web3.getCurrencyRateAddress(),
                provider
            );
            const rate = await currencyRateContract.get(symbol);
            const multiple = await this.getMultiple();
            return amount.mul(rate).div(multiple);
        } else {
            const rate = await this.getRate(currency.toLowerCase());
            const multiple = await this.getMultiple();
            return amount.mul(rate).div(multiple);
        }
    }
}
