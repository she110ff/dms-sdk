import { AccountIndex, NodeInfo } from "../helper/NodeInfo";
import { Client, Context, LoyaltyNetworkID, NormalSteps } from "../../src";

import { IShopData } from "../helper/types";

import { Wallet } from "@ethersproject/wallet";
import { AddressZero } from "@ethersproject/constants";

describe("Shop Withdrawal", () => {
    const contextParams = NodeInfo.getContextParams();
    const contractInfo = NodeInfo.getContractInfo();
    const accounts = NodeInfo.accounts();
    const validatorWallets = [
        accounts[AccountIndex.VALIDATOR01],
        accounts[AccountIndex.VALIDATOR02],
        accounts[AccountIndex.VALIDATOR03],
        accounts[AccountIndex.VALIDATOR04],
        accounts[AccountIndex.VALIDATOR05],
        accounts[AccountIndex.VALIDATOR06],
        accounts[AccountIndex.VALIDATOR07],
        accounts[AccountIndex.VALIDATOR08],
        accounts[AccountIndex.VALIDATOR09],
        accounts[AccountIndex.VALIDATOR10],
        accounts[AccountIndex.VALIDATOR11],
        accounts[AccountIndex.VALIDATOR12],
        accounts[AccountIndex.VALIDATOR13],
        accounts[AccountIndex.VALIDATOR14],
        accounts[AccountIndex.VALIDATOR15],
        accounts[AccountIndex.VALIDATOR16]
    ];
    const userWallets = [
        Wallet.createRandom(),
        Wallet.createRandom(),
        Wallet.createRandom(),
        Wallet.createRandom(),
        Wallet.createRandom()
    ];
    const shopWallets = [
        Wallet.createRandom(),
        Wallet.createRandom(),
        Wallet.createRandom(),
        Wallet.createRandom(),
        Wallet.createRandom(),
        Wallet.createRandom()
    ];

    const shopData: IShopData[] = [
        {
            shopId: "",
            name: "Shop1",
            currency: "krw",
            wallet: shopWallets[0]
        }
    ];

    let client: Client;
    beforeAll(async () => {
        const ctx = new Context(contextParams);
        client = new Client(ctx);
    });

    it("Server Health Checking", async () => {
        const isUp = await client.ledger.isRelayUp();
        expect(isUp).toEqual(true);
    });

    it("Prepare", async () => {
        await NodeInfo.transferBOA(userWallets.map((m) => m.address));
        await NodeInfo.transferBOA(shopWallets.map((m) => m.address));
        await NodeInfo.transferToken(
            contractInfo,
            userWallets.map((m) => m.address)
        );
        await NodeInfo.transferToken(
            contractInfo,
            shopWallets.map((m) => m.address)
        );

        for (const elem of shopData) {
            elem.shopId = await client.shop.makeShopId(elem.wallet.address, LoyaltyNetworkID.KIOS);
        }
        await NodeInfo.addShopData(contractInfo, shopData);
    });

    it("Set Exchange Rate", async () => {
        await NodeInfo.setExchangeRate(contractInfo.currencyRate, validatorWallets);
    });

    it("Check shop data", async () => {
        const shopInfo0 = await client.shop.getShopInfo(shopData[0].shopId);
        expect(shopInfo0.delegator).toEqual(AddressZero);
    });

    let delegator: string = "";
    it("Create delegator", async () => {
        client.useSigner(shopWallets[0]);
        for await (const step of client.shop.createDelegate(shopData[0].shopId)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.shopId).toEqual(shopData[0].shopId);
                    expect(step.account).toEqual(shopWallets[0].address);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.CREATED:
                    expect(step.shopId).toEqual(shopData[0].shopId);
                    expect(step.account).toEqual(shopWallets[0].address);
                    expect(step.delegator).toMatch(/^0x[A-Fa-f0-9]{40}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.shopId).toEqual(shopData[0].shopId);
                    expect(step.account).toEqual(shopWallets[0].address);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.DONE:
                    expect(step.shopId).toEqual(shopData[0].shopId);
                    expect(step.account).toEqual(shopWallets[0].address);
                    expect(step.delegator).toMatch(/^0x[A-Fa-f0-9]{40}$/i);
                    delegator = step.delegator;
                    break;
                default:
                    throw new Error("Unexpected create delegate step: " + JSON.stringify(step, null, 2));
            }
        }
    });

    it("Check shop data", async () => {
        const shopInfo0 = await client.shop.getShopInfo(shopData[0].shopId);
        expect(shopInfo0.delegator).toEqual(delegator);
    });

    it("Remove delegator", async () => {
        for await (const step of client.shop.removeDelegate(shopData[0].shopId)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.shopId).toEqual(shopData[0].shopId);
                    expect(step.account).toEqual(shopWallets[0].address);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.shopId).toEqual(shopData[0].shopId);
                    expect(step.account).toEqual(shopWallets[0].address);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.DONE:
                    expect(step.shopId).toEqual(shopData[0].shopId);
                    expect(step.account).toEqual(shopWallets[0].address);
                    expect(step.delegator).toMatch(/^0x[A-Fa-f0-9]{40}$/i);
                    delegator = step.account;
                    break;
                default:
                    throw new Error("Unexpected create delegate step: " + JSON.stringify(step, null, 2));
            }
        }
    });

    it("Check shop data", async () => {
        const shopInfo0 = await client.shop.getShopInfo(shopData[0].shopId);
        expect(shopInfo0.delegator).toEqual(AddressZero);
    });

    it("Temporary Account", async () => {
        client.useSigner(userWallets[0]);
        const temporaryAccount = await client.ledger.getTemporaryAccount();
        expect(temporaryAccount).toMatch(/^0x[A-Fa-f0-9]{40}$/i);
        console.log(temporaryAccount);
    });
});
