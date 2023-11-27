/*
import { contextParamsDevnet } from "../helper/constants";

import {
    Amount,
    Client,
    Context,
    ContractUtils,
    LIVE_CONTRACTS,
    LoyaltyType,
    NormalSteps,
    ShopAction,
    ShopWithdrawStatus
} from "../../src";
import { Wallet } from "@ethersproject/wallet";

// @ts-ignore
import fs from "fs";
import { BigNumber } from "@ethersproject/bignumber";
import { Network } from "../../src/client-common/interfaces/network";

import * as assert from "assert";

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
    loyaltyType: number;
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

            it("Check Settlement", async () => {
                withdrawalAmount = await client.shop.getWithdrawableAmount(shop.shopId);
            });

            it("Pay token", async () => {
                const purchase: IPurchaseData = {
                    purchaseId: "P100000",
                    timestamp: 1672844400,
                    amount: 100000,
                    currency: "krw",
                    shopIndex: 2,
                    userIndex: 0,
                    method: 0
                };

                const multiple = BigNumber.from(1_000_000_000);
                const price = BigNumber.from(150).mul(multiple);
                const paidPoint = Amount.make(purchase.amount, 18).value;
                const paidToken = paidPoint.mul(multiple).div(price);
                const feeToken = paidToken.mul(5).div(100);
                const totalToken = paidToken.add(feeToken);

                let userIndex = 0;
                for (const user of users) {
                    const loyaltyType = await client.ledger.getLoyaltyType(user.address);
                    if (loyaltyType !== LoyaltyType.TOKEN) continue;

                    const balance = await client.ledger.getTokenBalance(user.address);
                    if (balance.gt(totalToken)) {
                        purchase.userIndex = userIndex;
                        purchase.purchaseId = `P${ContractUtils.getTimeStamp()}`;

                        const userWallet = new Wallet(user.privateKey);
                        client.useSigner(userWallet);

                        // Open New
                        console.log("Pay token - Open New");
                        let res = await Network.post(
                            new URL(contextParamsDevnet.relayEndpoint + "v1/payment/new/open"),
                            {
                                accessKey: "0x2c93e943c0d7f6f1a42f53e116c52c40fe5c1b428506dc04b290f2a77580a342",
                                purchaseId: purchase.purchaseId,
                                amount: paidPoint.toString(),
                                currency: purchase.currency.toLowerCase(),
                                shopId: shops[purchase.shopIndex].shopId,
                                account: user.address
                            }
                        );
                        assert.deepStrictEqual(res.code, 0, res?.error?.message);
                        assert.notDeepStrictEqual(res.data, undefined);

                        const paymentId = res.data.paymentId;

                        await ContractUtils.delay(3000);

                        // Approve New
                        console.log("Pay token - Approve New");

                        // let detail = await client.ledger.getPaymentDetail(paymentId);
                        // for await (const step of client.ledger.approveNewPayment(
                        //     paymentId,
                        //     detail.purchaseId,
                        //     paidPoint,
                        //     detail.currency.toLowerCase(),
                        //     detail.shopId,
                        //     true
                        // )) {
                        //     switch (step.key) {
                        //         case NormalSteps.PREPARED:
                        //             expect(step.paymentId).toEqual(paymentId);
                        //             expect(step.purchaseId).toEqual(detail.purchaseId);
                        //             expect(step.amount).toEqual(paidPoint);
                        //             expect(step.currency).toEqual(detail.currency.toLowerCase());
                        //             expect(step.shopId).toEqual(detail.shopId);
                        //             expect(step.account).toEqual(user.address);
                        //             expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                        //             break;
                        //         case NormalSteps.SENT:
                        //             expect(step.paymentId).toEqual(paymentId);
                        //             expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        //             break;
                        //         case NormalSteps.APPROVED:
                        //             expect(step.paymentId).toEqual(paymentId);
                        //             expect(step.purchaseId).toEqual(detail.purchaseId);
                        //             expect(step.currency).toEqual(detail.currency.toLowerCase());
                        //             expect(step.shopId).toEqual(detail.shopId);
                        //             expect(step.paidToken).toEqual(paidToken);
                        //             expect(step.paidValue).toEqual(paidPoint);
                        //             break;
                        //         default:
                        //             throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
                        //     }
                        // }

                        await ContractUtils.delay(5000);

                        // Close New
                        console.log("Pay token - Close New");
                        res = await Network.post(new URL(contextParamsDevnet.relayEndpoint + "v1/payment/new/close"), {
                            accessKey: "0x2c93e943c0d7f6f1a42f53e116c52c40fe5c1b428506dc04b290f2a77580a342",
                            confirm: true,
                            paymentId
                        });
                        assert.deepStrictEqual(res.code, 0);

                        await ContractUtils.delay(1000);
                    }

                    withdrawalAmount = await client.shop.getWithdrawableAmount(shop.shopId);
                    console.log(`userIndex: ${userIndex} ${new Amount(withdrawalAmount, 18).toBOAString()}`);
                    if (withdrawalAmount.gt(Amount.make(500000, 18).value)) {
                        break;
                    }
                    userIndex++;
                }
            });

            it("Get Provide & Use History", async () => {
                const res = await client.shop.getProvideAndUseTradeHistory(shop.shopId);
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
                expect(shopInfo.withdrawStatus).toEqual(ShopWithdrawStatus.OPEN);
                expect(shopInfo.withdrawAmount.toString()).toEqual(withdrawalAmount.toString());
            });

            it("OpenWithdrawal History", async () => {
                const res = await client.shop.getWithdrawTradeHistory(shop.shopId);
                const length = res.shopTradeHistories.length;
                expect(length).toBeGreaterThan(0);
                expect(res.shopTradeHistories[0].shopId).toEqual(shop.shopId);
                expect(res.shopTradeHistories[0].action).toEqual(ShopAction.OPEN_WITHDRAWN);
            });

            it("Wait", async () => {
                await ContractUtils.delay(2000);
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

            it("Wait", async () => {
                await ContractUtils.delay(2000);
            });

            it("CloseWithdrawal History", async () => {
                const res = await client.shop.getWithdrawTradeHistory(shop.shopId);
                const length = res.shopTradeHistories.length;
                expect(length).toBeGreaterThan(0);
                expect(res.shopTradeHistories[0].shopId).toEqual(shop.shopId);
                expect(res.shopTradeHistories[0].action).toEqual(ShopAction.CLOSE_WITHDRAWN);
            });
        });
    });
});
*/
import { ContractUtils } from "../../src";

describe("Integrated test of Ledger", () => {
    describe("Method Check", () => {
        it("Wait", async () => {
            await ContractUtils.delay(1000);
        });
    });
});
