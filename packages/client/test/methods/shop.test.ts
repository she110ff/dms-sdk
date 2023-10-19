import { Server } from "ganache";
import { GanacheServer } from "../helper/GanacheServer";
import * as deployContracts from "../helper/deployContracts";
import { IShopData } from "../helper/deployContracts";
import { contextParamsLocalChain } from "../helper/constants";
import { Client, Context, ContractUtils, NormalSteps } from "../../src";
import { FakerRelayServer } from "../helper/FakerRelayServer";
import { Wallet } from "@ethersproject/wallet";

describe("Shop", () => {
    let node: Server;
    let deployment: deployContracts.Deployment;
    let fakerRelayServer: FakerRelayServer;

    beforeAll(async () => {
        node = await GanacheServer.start();
        const provider = GanacheServer.createTestProvider();
        GanacheServer.setTestProvider(provider);

        deployment = await deployContracts.deployAll(provider);
        contextParamsLocalChain.tokenAddress = deployment.token.address;
        contextParamsLocalChain.phoneLinkCollectionAddress = deployment.phoneLinkCollection.address;
        contextParamsLocalChain.validatorCollectionAddress = deployment.validatorCollection.address;
        contextParamsLocalChain.currencyRateAddress = deployment.currencyRate.address;
        contextParamsLocalChain.shopCollectionAddress = deployment.shopCollection.address;
        contextParamsLocalChain.ledgerAddress = deployment.ledger.address;
        contextParamsLocalChain.web3Providers = deployment.provider;

        fakerRelayServer = new FakerRelayServer(7070, deployment);
        await fakerRelayServer.start();
    });

    afterAll(async () => {
        await node.close();
        await fakerRelayServer.stop();
    });

    let shopData: IShopData;
    let shopWallet: Wallet;
    beforeAll(async () => {
        let accounts = GanacheServer.accounts();
        shopWallet = accounts[17];
        shopData = {
            shopId: "",
            name: "Shop6",
            provideWaitTime: 0,
            providePercent: 1,
            wallet: shopWallet
        };
        shopData.shopId = ContractUtils.getShopId(shopData.name, shopData.wallet.address);
        GanacheServer.setTestWeb3Signer(shopWallet);
    });

    let client: Client;
    beforeAll(async () => {
        contextParamsLocalChain.signer = shopWallet;
        const ctx = new Context(contextParamsLocalChain);
        client = new Client(ctx);
        client.web3.useSigner(shopWallet);
    });

    it("Server Health Checking", async () => {
        const isUp = await client.shop.isRelayUp();
        expect(isUp).toEqual(true);
    });

    it("Add", async () => {
        for await (const step of client.shop.add(
            shopData.shopId,
            shopData.name,
            shopData.provideWaitTime,
            shopData.providePercent
        )) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.shopId).toEqual(shopData.shopId);
                    expect(step.name).toEqual(shopData.name);
                    expect(step.provideWaitTime.toString()).toEqual(shopData.provideWaitTime.toString());
                    expect(step.providePercent.toString()).toEqual(shopData.providePercent.toString());
                    expect(step.account.toUpperCase()).toEqual(shopData.wallet.address.toUpperCase());
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    expect(step.shopId).toEqual(shopData.shopId);
                    break;
                case NormalSteps.DONE:
                    expect(step.shopId).toEqual(shopData.shopId);
                    expect(step.name).toEqual(shopData.name);
                    expect(step.provideWaitTime.toString()).toEqual(shopData.provideWaitTime.toString());
                    expect(step.providePercent.toString()).toEqual(shopData.providePercent.toString());
                    expect(step.account.toUpperCase()).toEqual(shopData.wallet.address.toUpperCase());
                    break;
                default:
                    throw new Error("Unexpected add shop step: " + JSON.stringify(step, null, 2));
            }
        }
    });

    it("Update", async () => {
        shopData.name = "New Name";
        shopData.provideWaitTime = 86400 * 7;
        shopData.providePercent = 10;

        for await (const step of client.shop.update(
            shopData.shopId,
            shopData.name,
            shopData.provideWaitTime,
            shopData.providePercent
        )) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.shopId).toEqual(shopData.shopId);
                    expect(step.name).toEqual(shopData.name);
                    expect(step.provideWaitTime.toString()).toEqual(shopData.provideWaitTime.toString());
                    expect(step.providePercent.toString()).toEqual(shopData.providePercent.toString());
                    expect(step.account.toUpperCase()).toEqual(shopData.wallet.address.toUpperCase());
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    expect(step.shopId).toEqual(shopData.shopId);
                    break;
                case NormalSteps.DONE:
                    expect(step.shopId).toEqual(shopData.shopId);
                    expect(step.name).toEqual(shopData.name);
                    expect(step.provideWaitTime.toString()).toEqual(shopData.provideWaitTime.toString());
                    expect(step.providePercent.toString()).toEqual(shopData.providePercent.toString());
                    expect(step.account.toUpperCase()).toEqual(shopData.wallet.address.toUpperCase());
                    break;
                default:
                    throw new Error("Unexpected update shop step: " + JSON.stringify(step, null, 2));
            }
        }
    });

    it("Remove", async () => {
        for await (const step of client.shop.remove(shopData.shopId)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.shopId).toEqual(shopData.shopId);
                    expect(step.account.toUpperCase()).toEqual(shopData.wallet.address.toUpperCase());
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    expect(step.shopId).toEqual(shopData.shopId);
                    break;
                case NormalSteps.DONE:
                    expect(step.shopId).toEqual(shopData.shopId);
                    break;
                default:
                    throw new Error("Unexpected remove shop step: " + JSON.stringify(step, null, 2));
            }
        }
    });
});
