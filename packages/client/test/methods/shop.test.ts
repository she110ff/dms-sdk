import { Client, Context, ContractUtils, NormalSteps, ShopStatus } from "../../src";
import { Wallet } from "@ethersproject/wallet";
import { Network } from "../../src/client-common/interfaces/network";

import * as assert from "assert";
import { NodeInfo } from "../helper/NodeInfo";

import { BigNumber } from "@ethersproject/bignumber";

export interface IShopData {
    shopId: string;
    name: string;
    currency: string;
    wallet: Wallet;
}

describe("Shop", () => {
    const contextParams = NodeInfo.getContextParams();
    let client: Client;

    let shopData: IShopData;
    let shopWallet: Wallet;

    beforeAll(async () => {
        shopWallet = Wallet.createRandom();
        shopData = {
            shopId: "",
            name: "Shop6",
            currency: "krw",
            wallet: shopWallet
        };
    });

    beforeAll(async () => {
        contextParams.signer = shopWallet;
        const ctx = new Context(contextParams);
        client = new Client(ctx);
    });

    it("Server Health Checking", async () => {
        const isUp = await client.shop.isRelayUp();
        expect(isUp).toEqual(true);
    });

    it("Create available ID", async () => {
        // 내부에 랜덤으로 32 Bytes 를 생성하여 ID를 생성하므로 무한반복될 가능성이 극히 낮음
        while (true) {
            shopData.shopId = ContractUtils.getShopId(shopData.wallet.address);
            if (await client.shop.isAvailableId(shopData.shopId)) break;
        }
    });

    it("Add", async () => {
        for await (const step of client.shop.add(shopData.shopId, shopData.name, shopData.currency)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.shopId).toEqual(shopData.shopId);
                    expect(step.name).toEqual(shopData.name);
                    expect(step.currency).toEqual(shopData.currency);
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

    it("Get ShopIDs", async () => {
        const length = await client.shop.getShopsCount();
        assert.deepStrictEqual(length, BigNumber.from(1));
        const res = await client.shop.getShops(0, length.toNumber());
        assert.deepStrictEqual(res, [shopData.shopId]);
    });

    it("Update", async () => {
        shopData.name = "New Name";

        // Open New
        let res = await Network.post(new URL(contextParams.relayEndpoint + "v1/shop/update/create"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
            shopId: shopData.shopId,
            name: shopData.name,
            currency: shopData.currency
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
                    break;
                default:
                    throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
            }
        }

        await ContractUtils.delay(3000);
    });

    it("Status", async () => {
        const info1 = await client.shop.getShopInfo(shopData.shopId);
        assert.deepStrictEqual(info1.status, ShopStatus.ACTIVE);

        // Open New
        let res = await Network.post(new URL(contextParams.relayEndpoint + "v1/shop/status/create"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
            shopId: shopData.shopId,
            status: ShopStatus.INACTIVE
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
                    expect(step.status).toEqual(ShopStatus.INACTIVE);
                    break;
                default:
                    throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
            }
        }

        await ContractUtils.delay(3000);
    });
});
