import { contextParamsLocalChain } from "./helper/constants";
import { Client, Context, ContractUtils } from "../src";
import { delay } from "./helper/deployContracts";
import { GanacheServer } from "./helper/GanacheServer";
import { Server } from "ganache";

// @ts-ignore
import fs from "fs";

describe("Client", () => {
    describe("Save Purchase Data & Pay (mileage, token)", () => {
        describe("Method Check", () => {
            let node: Server;
            let client: Client;
            beforeAll(async () => {
                node = await GanacheServer.start();
                const provider = GanacheServer.createTestProvider();
                GanacheServer.setTestProvider(provider);
                contextParamsLocalChain.web3Providers = provider;
                const ctx = new Context(contextParamsLocalChain);
                client = new Client(ctx);
            });
            afterAll(async () => {
                await node.close();
            });

            describe("GraphQL TEST", () => {
                const users = JSON.parse(fs.readFileSync("test/helper/users.json", "utf8"));

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
                    expect(res.userTradeHistories[length - 1].action).toEqual("DepositedToken");
                    expect(res.userTradeHistories[length - 1].amountToken).toEqual("50000000000000");
                });

                it("Mileage Input History", async () => {
                    for (const user of users) {
                        const hash = ContractUtils.sha256String(user.email);
                        const res = await client.methods.getUserMileageInputTradeHistory(user.email);
                        const length = res.userTradeHistories.length;
                        if (length > 0) {
                            expect(res.userTradeHistories[length - 1].email).toEqual(hash);
                            expect(res.userTradeHistories[length - 1].assetFlow).toEqual("MileageInput");
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

                it("Mileage Output History", async () => {
                    for (const user of users) {
                        const hash = ContractUtils.sha256String(user.email);
                        const res = await client.methods.getUserMileageOutputTradeHistory(user.email);
                        const length = res.userTradeHistories.length;
                        if (length > 0) {
                            expect(res.userTradeHistories[length - 1].email).toEqual(hash);
                            expect(res.userTradeHistories[length - 1].assetFlow).toEqual("MileageOutput");
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
            });
        });
    });
});
