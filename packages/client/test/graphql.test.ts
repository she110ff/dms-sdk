import { contextParamsDevnet } from "./helper/constants";
import { delay } from "./helper/deployContracts";
import { Amount, Client, Context, ContractUtils, LIVE_CONTRACTS, PayTokenSteps } from "../src";
import { BigNumber } from "@ethersproject/bignumber";
import { Wallet } from "@ethersproject/wallet";

// @ts-ignore
import fs from "fs";

describe("Client", () => {
    describe("Save Purchase Data & Pay (point, token)", () => {
        describe("Method Check", () => {
            let client: Client;
            const users = JSON.parse(fs.readFileSync("test/helper/users.json", "utf8"));
            beforeAll(async () => {
                contextParamsDevnet.tokenAddress = LIVE_CONTRACTS["bosagora_devnet"].TokenAddress;
                contextParamsDevnet.emailLinkCollectionAddress =
                    LIVE_CONTRACTS["bosagora_devnet"].EmailLinkCollectionAddress;
                contextParamsDevnet.validatorCollectionAddress =
                    LIVE_CONTRACTS["bosagora_devnet"].ValidatorCollectionAddress;
                contextParamsDevnet.tokenPriceAddress = LIVE_CONTRACTS["bosagora_devnet"].TokenPriceAddress;
                contextParamsDevnet.shopCollectionAddress = LIVE_CONTRACTS["bosagora_devnet"].ShopCollectionAddress;
                contextParamsDevnet.ledgerAddress = LIVE_CONTRACTS["bosagora_devnet"].LedgerAddress;
                contextParamsDevnet.signer = new Wallet(users[50]);
                const ctx = new Context(contextParamsDevnet);
                client = new Client(ctx);
            });

            it("Web3 Health Checking", async () => {
                const isUp = await client.methods.web3.isUp();
                expect(isUp).toEqual(true);
            });

            it("Server Health Checking", async () => {
                const isUp = await client.methods.isRelayUp();
                expect(isUp).toEqual(true);
            });

            describe("GraphQL TEST", () => {
                it("GraphQL Server Health Test", async () => {
                    const web3IsUp = await client.web3.isUp();
                    expect(web3IsUp).toEqual(true);
                    await delay(1000);
                    const isUp: boolean = await client.graphql.isUp();
                    await delay(1000);
                    expect(isUp).toEqual(true);
                });

                it("All History", async () => {
                    const user = users[50];
                    const hash = ContractUtils.sha256String(user.email);
                    const res = await client.methods.getUserTradeHistory(user.email);
                    const length = res.userTradeHistories.length;
                    expect(length).toBeGreaterThan(0);
                    expect(res.userTradeHistories[length - 1].email).toEqual(hash);
                });

                it("Point Input History", async () => {
                    for (const user of users) {
                        const hash = ContractUtils.sha256String(user.email);
                        const res = await client.methods.getUserPointInputTradeHistory(user.email);
                        const length = res.userTradeHistories.length;
                        if (length > 0) {
                            expect(res.userTradeHistories[length - 1].email).toEqual(hash);
                            expect(res.userTradeHistories[length - 1].assetFlow).toEqual("PointInput");
                        }
                    }
                });

                it("Token Input History", async () => {
                    for (const user of users) {
                        const hash = ContractUtils.sha256String(user.email);
                        const res = await client.methods.getUserTokenInputTradeHistory(user.email);
                        const length = res.userTradeHistories.length;
                        if (length > 0) {
                            expect(res.userTradeHistories[length - 1].email).toEqual(hash);
                            expect(res.userTradeHistories[length - 1].assetFlow).toEqual("TokenInput");
                        }
                    }
                });

                it("Point Output History", async () => {
                    for (const user of users) {
                        const hash = ContractUtils.sha256String(user.email);
                        const res = await client.methods.getUserPointOutputTradeHistory(user.email);
                        const length = res.userTradeHistories.length;
                        if (length > 0) {
                            expect(res.userTradeHistories[length - 1].email).toEqual(hash);
                            expect(res.userTradeHistories[length - 1].assetFlow).toEqual("PointOutput");
                        }
                    }
                });

                it("Token Output History", async () => {
                    for (const user of users) {
                        const hash = ContractUtils.sha256String(user.email);
                        const res = await client.methods.getUserTokenOutputTradeHistory(user.email);
                        const length = res.userTradeHistories.length;
                        if (length > 0) {
                            expect(res.userTradeHistories[length - 1].email).toEqual(hash);
                            expect(res.userTradeHistories[length - 1].assetFlow).toEqual("TokenOutput");
                        }
                    }
                });

                it("Pay token", async () => {
                    let selectUser;
                    for (const user of users) {
                        const balance = await client.methods.getTokenBalances(user.email);
                        if (balance.gt(0)) {
                            selectUser = user;
                            break;
                        }
                    }

                    const exampleData = {
                        purchaseId: "P100000",
                        timestamp: 1672844400,
                        amount: 1,
                        userEmail: selectUser.email,
                        shopId: "F000100",
                        method: 0
                    };
                    exampleData.purchaseId = `P${ContractUtils.getTimeStamp()}`;
                    const amount = Amount.make(1, 18);
                    const option = await client.methods.getPayTokenOption(
                        exampleData.purchaseId,
                        amount.value,
                        exampleData.userEmail,
                        exampleData.shopId
                    );

                    await ContractUtils.delay(2000);

                    for await (const step of client.methods.fetchPayToken(option)) {
                        switch (step.key) {
                            case PayTokenSteps.PAYING_TOKEN:
                                expect(typeof step.txHash).toBe("string");
                                expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                                expect(step.purchaseId).toEqual(exampleData.purchaseId);
                                break;
                            case PayTokenSteps.DONE:
                                expect(step.amount instanceof BigNumber).toBe(true);
                                expect(step.amount.toString()).toBe(amount.toString());
                                expect(step.purchaseId).toEqual(exampleData.purchaseId);
                                break;
                            default:
                                throw new Error("Unexpected pay token step: " + JSON.stringify(step, null, 2));
                        }
                    }

                    const hash = ContractUtils.sha256String(exampleData.userEmail);
                    const res = await client.methods.getPaidToken(exampleData.userEmail, exampleData.purchaseId);
                    if (length == 1) {
                        expect(res.paidToken[0].email).toEqual(hash);
                        expect(res.paidToken[0].purchaseId).toEqual(exampleData.purchaseId);
                    }
                });

                /*
                it("Pay point", async () => {
                    let selectUser;
                    for (const user of users) {
                        const balance = await client.methods.getPointBalances(user.email);
                        if (balance.gt(0)) {
                            selectUser = user;
                            break;
                        }
                    }

                    const exampleData = {
                        purchaseId: "P100000",
                        timestamp: 1672844400,
                        amount: 1,
                        userEmail: selectUser.email,
                        shopId: "F000100",
                        method: 0
                    };
                    exampleData.purchaseId = `P${ContractUtils.getTimeStamp()}`;
                    const amount = Amount.make(1, 18);
                    const option = await client.methods.getPayPointOption(
                        exampleData.purchaseId,
                        amount.value,
                        exampleData.userEmail,
                        exampleData.shopId
                    );

                    await ContractUtils.delay(2000);

                    for await (const step of client.methods.fetchPayPoint(option)) {
                        switch (step.key) {
                            case PayPointSteps.PAYING_POINT:
                                expect(typeof step.txHash).toBe("string");
                                expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                                expect(step.purchaseId).toEqual(exampleData.purchaseId);
                                break;
                            case PayPointSteps.DONE:
                                expect(step.amount instanceof BigNumber).toBe(true);
                                expect(step.amount.toString()).toBe(amount.toString());
                                expect(step.purchaseId).toEqual(exampleData.purchaseId);
                                break;
                            default:
                                throw new Error("Unexpected pay token step: " + JSON.stringify(step, null, 2));
                        }
                    }

                    const hash = ContractUtils.sha256String(exampleData.userEmail);
                    const res = await client.methods.getPaidPoint(exampleData.userEmail, exampleData.purchaseId);
                    if (length == 1) {
                        expect(res.paidToken[0].email).toEqual(hash);
                        expect(res.paidToken[0].purchaseId).toEqual(exampleData.purchaseId);
                    }
                });
                */
            });
        });
    });
});
