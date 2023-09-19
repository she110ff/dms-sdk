import { contextParamsLocalChain } from "./helper/constants";
import { Client, Context, ContractUtils } from "../src";
import { delay } from "./helper/deployContracts";
import { GanacheServer } from "./helper/GanacheServer";
import { Server } from "ganache";

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
                it("GraphQL Server Health Test", async () => {
                    const web3IsUp = await client.web3.isUp();
                    expect(web3IsUp).toEqual(true);
                    await delay(1000);
                    const isUp: boolean = await client.graphql.isUp();
                    await delay(1000);
                    expect(isUp).toEqual(true);
                });
                it("History", async () => {
                    const email = "50@example.com";
                    console.log("Email HAsh ", ContractUtils.sha256String(email));
                    const res = await client.methods.getUserTradeHistory(email);
                    console.log("res : ", res);
                });
            });
        });
    });
});
