import { Amount, Client, Context, ContractUtils } from "../../src";
import { NodeInfo } from "../helper/NodeInfo";

describe("Currency", () => {
    const contextParams = NodeInfo.getContextParams();
    let client: Client;

    beforeAll(async () => {
        const ctx = new Context(contextParams);
        client = new Client(ctx);
    });

    it("Web3 Health Checking", async () => {
        const isUp = await client.link.web3.isUp();
        expect(isUp).toEqual(true);
    });

    it("Test of Currency", async () => {
        const amount = Amount.make(100, 18).value;
        const multiple = await client.currency.getMultiple();
        expect(await client.currency.currencyToPoint(amount, "krw")).toEqual(amount);

        let currencyRate = await client.currency.getRate("jpy");
        expect(await client.currency.currencyToPoint(amount, "jpy")).toEqual(
            ContractUtils.zeroGWEI(amount.mul(currencyRate).div(multiple))
        );
        expect(await client.currency.pointToCurrency(amount, "jpy")).toEqual(
            ContractUtils.zeroGWEI(amount.mul(multiple).div(currencyRate))
        );

        const tokenSymbol = await client.currency.getTokenSymbol();
        const tokenRate = await client.currency.getRate(tokenSymbol);
        expect(await client.currency.pointToToken(amount)).toEqual(
            ContractUtils.zeroGWEI(amount.mul(multiple).div(tokenRate))
        );
        expect(await client.currency.tokenToPoint(amount)).toEqual(
            ContractUtils.zeroGWEI(amount.mul(tokenRate).div(multiple))
        );

        expect(await client.currency.tokenToCurrency(amount, "jpy")).toEqual(
            ContractUtils.zeroGWEI(
                amount
                    .mul(tokenRate)
                    .div(multiple)
                    .mul(multiple)
                    .div(currencyRate)
            )
        );
        expect(await client.currency.currencyToToken(amount, "jpy")).toEqual(
            ContractUtils.zeroGWEI(
                amount
                    .mul(currencyRate)
                    .div(multiple)
                    .mul(multiple)
                    .div(tokenRate)
            )
        );
    });
});
