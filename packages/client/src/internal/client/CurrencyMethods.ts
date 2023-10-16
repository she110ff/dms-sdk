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
