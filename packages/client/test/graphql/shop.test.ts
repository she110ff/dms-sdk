import { contextParamsDevnet } from "../helper/constants";
import { Amount, Client, Context, ContractUtils, LIVE_CONTRACTS, NormalSteps, WithdrawStatus } from "../../src";
import { Wallet } from "@ethersproject/wallet";

// @ts-ignore
import fs from "fs";
import { BigNumber } from "@ethersproject/bignumber";

export interface IPurchaseData {
    purchaseId: string;
    timestamp: number;
    amount: number;
    method: number;
    currency: string;
    userIndex: number;
    shopIndex: number;
}

interface IUserData {
    idx: number;
    phone: string;
    address: string;
    privateKey: string;
    royaltyType: number;
}

export interface IShopData {
    shopId: string;
    name: string;
    provideWaitTime: number;
    providePercent: number;
    address: string;
    privateKey: string;
}

describe("Integrated test of ShopCollection", () => {
    let shop: IShopData;
    let shopIndex: number;
    let withdrawalAmount: BigNumber;
    describe("Method Check", () => {
        let client: Client;
        const users: IUserData[] = JSON.parse(fs.readFileSync("test/helper/users.json", "utf8"));
        const shops: IShopData[] = JSON.parse(fs.readFileSync("test/helper/shops.json", "utf8"));
        shopIndex = 2;
        shop = shops[shopIndex];
        beforeAll(async () => {
            contextParamsDevnet.tokenAddress = LIVE_CONTRACTS["bosagora_devnet"].TokenAddress;
            contextParamsDevnet.phoneLinkCollectionAddress =
                LIVE_CONTRACTS["bosagora_devnet"].PhoneLinkCollectionAddress;
            contextParamsDevnet.validatorCollectionAddress =
                LIVE_CONTRACTS["bosagora_devnet"].ValidatorCollectionAddress;
            contextParamsDevnet.currencyRateAddress = LIVE_CONTRACTS["bosagora_devnet"].CurrencyRateAddress;
            contextParamsDevnet.shopCollectionAddress = LIVE_CONTRACTS["bosagora_devnet"].ShopCollectionAddress;
            contextParamsDevnet.ledgerAddress = LIVE_CONTRACTS["bosagora_devnet"].LedgerAddress;
            contextParamsDevnet.signer = new Wallet(shops[shopIndex].privateKey);
            const ctx = new Context(contextParamsDevnet);
            client = new Client(ctx);
        });

        it("Web3 Health Checking", async () => {
            const isUp = await client.ledger.web3.isUp();
            expect(isUp).toEqual(true);
        });

        it("Server Health Checking", async () => {
            const isUp = await client.ledger.isRelayUp();
            expect(isUp).toEqual(true);
        });

        describe("GraphQL TEST", () => {
            it("GraphQL Server Health Test", async () => {
                const web3IsUp = await client.web3.isUp();
                expect(web3IsUp).toEqual(true);
                await ContractUtils.delay(1000);
                const isUp: boolean = await client.graphql.isUp();
                await ContractUtils.delay(1000);
                expect(isUp).toEqual(true);
            });

            it("All History", async () => {
                const shop = shops[0];
                const res = await client.shop.getShopTradeHistory(shop.shopId);
                const length = res.shopTradeHistories.length;
                expect(length).toBeGreaterThan(0);
                expect(res.shopTradeHistories[length - 1].shopId).toEqual(shop.shopId);
            });

            it("Check Settlement", async () => {
                withdrawalAmount = await client.shop.getWithdrawableAmount(shop.shopId);
            });

            it("Pay token", async () => {
                const purchase: IPurchaseData = {
                    purchaseId: "P100000",
                    timestamp: 1672844400,
                    amount: 10000,
                    currency: "krw",
                    shopIndex: 2,
                    userIndex: 0,
                    method: 0
                };

                const multiple = BigNumber.from(1_000_000_000);
                const price = BigNumber.from(150).mul(multiple);
                const amount = Amount.make(purchase.amount * 10, 18).value;
                const tokenAmount = amount.mul(multiple).div(price);

                let userIndex = 0;
                for (const user of users) {
                    const balance = await client.ledger.getTokenBalance(user.address);
                    if (balance.gt(tokenAmount)) {
                        purchase.userIndex = userIndex;
                        purchase.purchaseId = `P${ContractUtils.getTimeStamp()}`;

                        client.useSigner(new Wallet(users[purchase.userIndex].privateKey));

                        for await (const step of client.ledger.payToken(
                            purchase.purchaseId,
                            amount,
                            purchase.currency,
                            shops[purchase.shopIndex].shopId
                        )) {
                            switch (step.key) {
                                case NormalSteps.PREPARED:
                                    expect(step.purchaseId).toEqual(purchase.purchaseId);
                                    expect(step.amount).toEqual(amount);
                                    expect(step.currency).toEqual(purchase.currency.toLowerCase());
                                    expect(step.shopId).toEqual(shops[purchase.shopIndex].shopId);
                                    expect(step.account.toUpperCase()).toEqual(users[userIndex].address.toUpperCase());
                                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                                    break;
                                case NormalSteps.SENT:
                                    expect(typeof step.txHash).toBe("string");
                                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                                    expect(step.purchaseId).toEqual(purchase.purchaseId);
                                    break;
                                case NormalSteps.DONE:
                                    expect(step.purchaseId).toEqual(purchase.purchaseId);
                                    expect(step.paidValue).toEqual(amount);
                                    break;
                                default:
                                    throw new Error("Unexpected pay token step: " + JSON.stringify(step, null, 2));
                            }
                        }
                    }

                    withdrawalAmount = await client.shop.getWithdrawableAmount(shop.shopId);
                    console.log(`userIndex: ${userIndex} ${new Amount(withdrawalAmount, 18).toBOAString()}`);
                    if (withdrawalAmount.gt(Amount.make(500000, 18).value)) {
                        break;
                    }
                    userIndex++;
                }
            });

            it("Provided History", async () => {
                const res = await client.shop.getShopProvidedTradeHistory(shop.shopId);
                const length = res.shopTradeHistories.length;
                expect(length).toBeGreaterThan(0);
                expect(res.shopTradeHistories[length - 1].shopId).toEqual(shop.shopId);
            });

            it("Used History", async () => {
                const res = await client.shop.getShopUsedTradeHistory(shop.shopId);
                const length = res.shopTradeHistories.length;
                expect(length).toBeGreaterThan(0);
                expect(res.shopTradeHistories[length - 1].shopId).toEqual(shop.shopId);
            });

            it("Check Settlement", async () => {
                withdrawalAmount = await client.shop.getWithdrawableAmount(shop.shopId);
            });

            it("Open Withdrawal", async () => {
                client.useSigner(new Wallet(shop.privateKey));

                for await (const step of client.shop.openWithdrawal(shop.shopId, withdrawalAmount)) {
                    switch (step.key) {
                        case NormalSteps.PREPARED:
                            expect(step.shopId).toEqual(shop.shopId);
                            expect(step.account.toUpperCase()).toEqual(shop.address.toUpperCase());
                            expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                            break;
                        case NormalSteps.SENT:
                            expect(step.shopId).toEqual(shop.shopId);
                            expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                            break;
                        case NormalSteps.DONE:
                            expect(step.shopId).toEqual(shop.shopId);
                            expect(step.amount.toString()).toEqual(withdrawalAmount.toString());
                            expect(step.account.toUpperCase()).toEqual(shop.address.toUpperCase());
                            break;
                        default:
                            throw new Error("Unexpected open withdrawal step: " + JSON.stringify(step, null, 2));
                    }
                }
            });

            it("Check Withdraw Status - Working", async () => {
                const shopInfo = await client.shop.getShopInfo(shop.shopId);
                expect(shopInfo.withdrawStatus).toEqual(WithdrawStatus.OPEN);
                expect(shopInfo.withdrawAmount.toString()).toEqual(withdrawalAmount.toString());
            });

            it("OpenWithdrawal History", async () => {
                const res = await client.shop.getShopOpenWithdrawnTradeHistory(shop.shopId);
                const length = res.shopTradeHistories.length;
                expect(length).toBeGreaterThan(0);
                expect(res.shopTradeHistories[length - 1].shopId).toEqual(shop.shopId);
            });

            it("Close Withdrawal", async () => {
                client.useSigner(new Wallet(shop.privateKey));

                for await (const step of client.shop.closeWithdrawal(shop.shopId)) {
                    switch (step.key) {
                        case NormalSteps.PREPARED:
                            expect(step.shopId).toEqual(shop.shopId);
                            expect(step.account.toUpperCase()).toEqual(shop.address.toUpperCase());
                            expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                            break;
                        case NormalSteps.SENT:
                            expect(step.shopId).toEqual(shop.shopId);
                            expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                            break;
                        case NormalSteps.DONE:
                            expect(step.shopId).toEqual(shop.shopId);
                            expect(step.amount.toString()).toEqual(withdrawalAmount.toString());
                            expect(step.account.toUpperCase()).toEqual(shop.address.toUpperCase());
                            break;
                        default:
                            throw new Error("Unexpected close withdrawal step: " + JSON.stringify(step, null, 2));
                    }
                }
            });

            it("CloseWithdrawal History", async () => {
                const res = await client.shop.getShopCloseWithdrawnTradeHistory(shop.shopId);
                const length = res.shopTradeHistories.length;
                expect(length).toBeGreaterThan(0);
                expect(res.shopTradeHistories[length - 1].shopId).toEqual(shop.shopId);
            });
        });
    });
});
