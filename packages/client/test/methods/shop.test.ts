import { Server } from "ganache";
import { AccountIndex, GanacheServer } from "../helper/GanacheServer";
import { ContractDeployer, Deployment, IShopData } from "../helper/ContractDeployer";
import { contextParamsLocalChain } from "../helper/constants";
import { Client, Context, ContractUtils, NormalSteps, ShopStatus } from "../../src";
import { FakerRelayServer } from "../helper/FakerRelayServer";
import { Wallet } from "@ethersproject/wallet";
import { Network } from "../../src/client-common/interfaces/network";

import * as assert from "assert";

describe("Shop", () => {
    let node: Server;
    let deployment: Deployment;
    let fakerRelayServer: FakerRelayServer;

    beforeAll(async () => {
        node = await GanacheServer.start();

        deployment = await ContractDeployer.deploy();

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
        shopWallet = accounts[AccountIndex.SHOP6];
        shopData = {
            shopId: "",
            name: "Shop6",
            provideWaitTime: 0,
            providePercent: 1,
            wallet: shopWallet
        };
        shopData.shopId = ContractUtils.getShopId(shopData.wallet.address);
        GanacheServer.setTestWeb3Signer(shopWallet);
    });

    let client: Client;
    beforeAll(async () => {
        contextParamsLocalChain.signer = shopWallet;
        const ctx = new Context(contextParamsLocalChain);
        client = new Client(ctx);
    });

    it("Server Health Checking", async () => {
        const isUp = await client.shop.isRelayUp();
        expect(isUp).toEqual(true);
    });

    it("Add", async () => {
        for await (const step of client.shop.add(shopData.shopId, shopData.name)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.shopId).toEqual(shopData.shopId);
                    expect(step.name).toEqual(shopData.name);
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
                    expect(step.account.toUpperCase()).toEqual(shopData.wallet.address.toUpperCase());
                    break;
                default:
                    throw new Error("Unexpected add shop step: " + JSON.stringify(step, null, 2));
            }
        }
    });

    it("Update", async () => {
        shopData.name = "New Name";
        shopData.provideWaitTime = 86400 * 12;
        shopData.providePercent = 3;

        // Open New
        let res = await Network.post(new URL("http://localhost:7070/v1/shop/update/create"), {
            accessKey: FakerRelayServer.ACCESS_KEY,
            shopId: shopData.shopId,
            name: shopData.name,
            provideWaitTime: shopData.provideWaitTime,
            providePercent: shopData.providePercent
        });
        assert.deepStrictEqual(res.code, 0);
        assert.notDeepStrictEqual(res.data, undefined);

        const taskId = res.data.taskId;

        await ContractUtils.delay(3000);

        let detail = await client.shop.getTaskDetail(taskId);

        // Approve New
        client.useSigner(shopWallet);
        for await (const step of client.shop.approveUpdate(taskId, shopData.shopId, true)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.taskId).toEqual(taskId);
                    expect(step.shopId).toEqual(detail.shopId);
                    expect(step.account).toEqual(shopWallet.address);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.taskId).toEqual(taskId);
                    expect(step.shopId).toEqual(detail.shopId);
                    expect(step.account).toEqual(shopWallet.address);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.APPROVED:
                    expect(step.taskId).toEqual(taskId);
                    expect(step.shopId).toEqual(detail.shopId);
                    expect(step.account).toEqual(shopWallet.address);
                    expect(step.name).toEqual(shopData.name);
                    expect(step.provideWaitTime).toEqual(shopData.provideWaitTime);
                    expect(step.providePercent).toEqual(shopData.providePercent);
                    break;
                default:
                    throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
            }
        }

        await ContractUtils.delay(3000);
    });

    it("Status", async () => {
        const info1 = await client.shop.getShopInfo(shopData.shopId);
        assert.deepStrictEqual(info1.status, ShopStatus.INACTIVE);

        // Open New
        let res = await Network.post(new URL("http://localhost:7070/v1/shop/status/create"), {
            accessKey: FakerRelayServer.ACCESS_KEY,
            shopId: shopData.shopId,
            status: ShopStatus.ACTIVE
        });
        assert.deepStrictEqual(res.code, 0);
        assert.notDeepStrictEqual(res.data, undefined);

        const taskId = res.data.taskId;

        await ContractUtils.delay(3000);

        let detail = await client.shop.getTaskDetail(taskId);

        // Approve New
        client.useSigner(shopWallet);
        for await (const step of client.shop.approveStatus(taskId, shopData.shopId, true)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.taskId).toEqual(taskId);
                    expect(step.shopId).toEqual(detail.shopId);
                    expect(step.account).toEqual(shopWallet.address);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.taskId).toEqual(taskId);
                    expect(step.shopId).toEqual(detail.shopId);
                    expect(step.account).toEqual(shopWallet.address);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.APPROVED:
                    expect(step.taskId).toEqual(taskId);
                    expect(step.shopId).toEqual(detail.shopId);
                    expect(step.account).toEqual(shopWallet.address);
                    expect(step.status).toEqual(ShopStatus.ACTIVE);
                    break;
                default:
                    throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
            }
        }

        await ContractUtils.delay(3000);
    });
});
