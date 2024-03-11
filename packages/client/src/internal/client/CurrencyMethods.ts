import { ClientCore, Context, SupportedNetwork, SupportedNetworkArray } from "../../client-common";
import { ICurrencyMethods } from "../../interface/ICurrency";
import { CurrencyRate, CurrencyRate__factory, LoyaltyToken, LoyaltyToken__factory } from "dms-osx-lib";
import { Provider } from "@ethersproject/providers";
import { NoProviderError, UnsupportedNetworkError } from "dms-sdk-common";
import { BigNumber } from "@ethersproject/bignumber";
import { ContractUtils } from "../../utils/ContractUtils";
import { getNetwork } from "../../utils/Utilty";

/**
 * 환률정보를 제공하고, 통화량을 환산하는 기능이 포함된 클래스이다.
 */
export class CurrencyMethods extends ClientCore implements ICurrencyMethods {
    constructor(context: Context) {
        super(context);
        Object.freeze(CurrencyMethods.prototype);
        Object.freeze(this);
    }

    /**
     * KRW 에 대한 환률정보를 제공한다
     * @param symbol 통화코드
     */
    public async getRate(symbol: string): Promise<BigNumber> {
        if (symbol === "krw") {
            return this.getMultiple();
        } else {
            const provider = this.web3.getProvider() as Provider;
            if (!provider) throw new NoProviderError();

            const network = getNetwork((await provider.getNetwork()).chainId);
            const networkName = network.name as SupportedNetwork;
            if (!SupportedNetworkArray.includes(networkName)) {
                throw new UnsupportedNetworkError(networkName);
            }

            const contract: CurrencyRate = CurrencyRate__factory.connect(this.web3.getCurrencyRateAddress(), provider);
            return await contract.get(symbol);
        }
    }

    private static _CurrencyMultiple: BigNumber = BigNumber.from(0);
    public async getMultiple(): Promise<BigNumber> {
        if (CurrencyMethods._CurrencyMultiple.eq(BigNumber.from(0))) {
            const provider = this.web3.getProvider() as Provider;
            if (!provider) throw new NoProviderError();

            const network = getNetwork((await provider.getNetwork()).chainId);
            const networkName = network.name as SupportedNetwork;
            if (!SupportedNetworkArray.includes(networkName)) {
                throw new UnsupportedNetworkError(networkName);
            }

            const contract: CurrencyRate = CurrencyRate__factory.connect(this.web3.getCurrencyRateAddress(), provider);
            CurrencyMethods._CurrencyMultiple = await contract.multiple();
        }
        return CurrencyMethods._CurrencyMultiple;
    }

    private static _TokenSymbol: string = "";
    public async getTokenSymbol(): Promise<string> {
        if (CurrencyMethods._TokenSymbol === "") {
            const provider = this.web3.getProvider() as Provider;
            if (!provider) throw new NoProviderError();

            const network = getNetwork((await provider.getNetwork()).chainId);
            const networkName = network.name as SupportedNetwork;
            if (!SupportedNetworkArray.includes(networkName)) {
                throw new UnsupportedNetworkError(networkName);
            }

            const contract: LoyaltyToken = LoyaltyToken__factory.connect(this.web3.getTokenAddress(), provider);
            CurrencyMethods._TokenSymbol = await contract.symbol();
        }
        return CurrencyMethods._TokenSymbol;
    }

    /**
     * 포인트를 토큰의 량으로 환산한다.
     * @param amount 포인트 량
     */
    public async pointToToken(amount: BigNumber): Promise<BigNumber> {
        const symbol = await this.getTokenSymbol();
        const rate = await this.getRate(symbol);
        const multiple = await this.getMultiple();
        return ContractUtils.zeroGWEI(amount.mul(multiple).div(rate));
    }

    /**
     * 토큰을 포인트로 변경한다.
     * @param amount  토큰 량
     */
    public async tokenToPoint(amount: BigNumber): Promise<BigNumber> {
        const symbol = await this.getTokenSymbol();
        const rate = await this.getRate(symbol);
        const multiple = await this.getMultiple();
        return ContractUtils.zeroGWEI(amount.mul(rate).div(multiple));
    }

    /**
     * 법정화폐 포인트 량으로 환산한다.
     * @param amount 법정화폐 량
     * @param symbol 통화 심벌
     */
    public async currencyToPoint(amount: BigNumber, symbol: string): Promise<BigNumber> {
        const rate = await this.getRate(symbol.toLowerCase());
        const multiple = await this.getMultiple();
        return ContractUtils.zeroGWEI(amount.mul(rate).div(multiple));
    }

    /**
     * 포인트를 법정화폐 량으로 환산한다.
     * @param amount 포인트 량
     * @param symbol 통화 심벌
     */
    public async pointToCurrency(amount: BigNumber, symbol: string): Promise<BigNumber> {
        const rate = await this.getRate(symbol.toLowerCase());
        const multiple = await this.getMultiple();
        return ContractUtils.zeroGWEI(amount.mul(multiple).div(rate));
    }

    /**
     * 법정화폐 토큰의 량으로 환산한다.
     * @param amount 법정화폐 량
     * @param symbol 통화 심벌
     */
    public async currencyToToken(amount: BigNumber, symbol: string): Promise<BigNumber> {
        return await this.pointToToken(await this.currencyToPoint(amount, symbol));
    }

    /**
     * 토큰을 법정화폐의 량으로 환산한다.
     * @param amount 토큰 량
     * @param symbol 통화 심벌
     */
    public async tokenToCurrency(amount: BigNumber, symbol: string): Promise<BigNumber> {
        return await this.pointToCurrency(await this.tokenToPoint(amount), symbol);
    }
}
