import { Network } from "../../src/client-common/interfaces/network";
import { AccountIndex, NodeInfo } from "../helper/NodeInfo";
import { Amount, Client, Context, ContractUtils, NormalSteps, ShopWithdrawStatus } from "../../src";

import { IShopData, IUserData, IPurchaseData } from "../helper/types";

import * as assert from "assert";

import { BigNumber } from "@ethersproject/bignumber";
import { Wallet } from "@ethersproject/wallet";
import { NonceManager } from "@ethersproject/experimental";

describe("Shop Withdrawal", () => {
    const contextParams = NodeInfo.getContextParams();
    const contractInfo = NodeInfo.getContractInfo();
    const accounts = NodeInfo.accounts();
    const validatorWallets = [
        accounts[AccountIndex.VALIDATOR1],
        accounts[AccountIndex.VALIDATOR2],
        accounts[AccountIndex.VALIDATOR3],
        accounts[AccountIndex.VALIDATOR4],
        accounts[AccountIndex.VALIDATOR5]
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

    const userData: IUserData[] = [
        {
            phone: "08201012341001",
            address: userWallets[0].address,
            privateKey: userWallets[0].privateKey
        },
        {
            phone: "08201012341002",
            address: userWallets[1].address,
            privateKey: userWallets[1].privateKey
        },
        {
            phone: "08201012341003",
            address: userWallets[2].address,
            privateKey: userWallets[2].privateKey
        },
        {
            phone: "08201012341004",
            address: userWallets[3].address,
            privateKey: userWallets[3].privateKey
        },
        {
            phone: "08201012341005",
            address: userWallets[4].address,
            privateKey: userWallets[4].privateKey
        }
    ];
    const shopData: IShopData[] = [
        {
            shopId: "",
            name: "Shop1",
            currency: "krw",
            wallet: shopWallets[0]
        },
        {
            shopId: "",
            name: "Shop2",
            currency: "krw",
            wallet: shopWallets[1]
        },
        {
            shopId: "",
            name: "Shop3",
            currency: "krw",
            wallet: shopWallets[2]
        },
        {
            shopId: "",
            name: "Shop4",
            currency: "krw",
            wallet: shopWallets[3]
        },
        {
            shopId: "",
            name: "Shop5",
            currency: "krw",
            wallet: shopWallets[4]
        }
    ];
    const purchaseData: IPurchaseData[] = [
        {
            purchaseId: "P000001",
            timestamp: 1672844400,
            amount: 10000,
            method: 0,
            currency: "krw",
            shopIndex: 0,
            userIndex: 0
        },
        {
            purchaseId: "P000002",
            timestamp: 1675522800,
            amount: 10000,
            method: 0,
            currency: "krw",
            shopIndex: 0,
            userIndex: 0
        },
        {
            purchaseId: "P000003",
            timestamp: 1677942000,
            amount: 10000,
            method: 0,
            currency: "krw",
            shopIndex: 0,
            userIndex: 0
        },
        {
            purchaseId: "P000004",
            timestamp: 1680620400,
            amount: 10000,
            method: 0,
            currency: "krw",
            shopIndex: 1,
            userIndex: 0
        },
        {
            purchaseId: "P000005",
            timestamp: 1683212400,
            amount: 10000,
            method: 0,
            currency: "krw",
            shopIndex: 2,
            userIndex: 0
        },
        {
            purchaseId: "P000005",
            timestamp: 1683212400,
            amount: 10000,
            method: 0,
            currency: "krw",
            shopIndex: 3,
            userIndex: 0
        }
    ];

    let shop: IShopData;
    let userIndex: number;
    let shopIndex: number;
    let amount2: BigNumber;

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
            elem.shopId = ContractUtils.getShopId(elem.wallet.address);
        }
        await NodeInfo.addShopData(contractInfo, shopData);
    });

    it("Save Purchase Data", async () => {
        for (const purchase of purchaseData) {
            const phoneHash = ContractUtils.getPhoneHash(userData[purchase.userIndex].phone);
            const purchaseAmount = Amount.make(purchase.amount, 18).value;
            const loyaltyAmount = purchaseAmount.mul(1).div(100);
            const userAccount = userData[purchase.userIndex].address.trim();

            const purchaseParams = {
                purchaseId: NodeInfo.getPurchaseId(),
                amount: purchaseAmount,
                loyalty: loyaltyAmount,
                currency: purchase.currency.toLowerCase(),
                shopId: shopData[purchase.shopIndex].shopId,
                account: userAccount,
                phone: phoneHash
            };
            const purchaseMessage = ContractUtils.getPurchasesMessage([purchaseParams]);
            const signatures = validatorWallets.map((m) => ContractUtils.signMessage(m, purchaseMessage));
            await contractInfo.loyaltyProvider.connect(validatorWallets[4]).savePurchase([purchaseParams], signatures);
        }
    });

    it("Check shop data", async () => {
        const shopInfo1 = await client.shop.getShopInfo(shopData[0].shopId);
        expect(shopInfo1.providedAmount.toString()).toEqual(
            Amount.make(10000 * 3, 18)
                .value.mul(1)
                .div(100)
                .toString()
        );

        const shopInfo2 = await client.shop.getShopInfo(shopData[1].shopId);
        expect(shopInfo2.providedAmount.toString()).toEqual(
            Amount.make(10000 * 1, 18)
                .value.mul(1)
                .div(100)
                .toString()
        );
        const shopInfo3 = await client.shop.getShopInfo(shopData[2].shopId);
        expect(shopInfo3.providedAmount.toString()).toEqual(
            Amount.make(10000 * 1, 18)
                .value.mul(1)
                .div(100)
                .toString()
        );
        const shopInfo4 = await client.shop.getShopInfo(shopData[3].shopId);
        expect(shopInfo4.providedAmount.toString()).toEqual(
            Amount.make(10000 * 1, 18)
                .value.mul(1)
                .div(100)
                .toString()
        );
    });

    it("Set User & Shop", async () => {
        userIndex = 0;
        shopIndex = 1;
    });

    it("Pay point", async () => {
        const purchase = {
            purchaseId: "P000100",
            timestamp: 1672849000,
            amount: 300,
            method: 0,
            currency: "krw",
            shopIndex,
            userIndex
        };

        const purchaseAmount = Amount.make(purchase.amount, 18).value;

        client.useSigner(userWallets[purchase.userIndex]);

        // Open New
        let res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/new/open"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
            purchaseId: purchase.purchaseId,
            amount: purchaseAmount.toString(),
            currency: purchase.currency.toLowerCase(),
            shopId: shopData[shopIndex].shopId,
            account: userWallets[userIndex].address
        });
        assert.deepStrictEqual(res.code, 0);
        assert.notDeepStrictEqual(res.data, undefined);

        const paymentId = res.data.paymentId;

        await ContractUtils.delay(3000);

        // Approve New
        client.useSigner(userWallets[userIndex]);
        for await (const step of client.ledger.approveNewPayment(
            paymentId,
            purchase.purchaseId,
            purchaseAmount,
            purchase.currency.toLowerCase(),
            shopData[shopIndex].shopId,
            true
        )) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(purchase.purchaseId);
                    expect(step.amount).toEqual(purchaseAmount);
                    expect(step.currency).toEqual(purchase.currency.toLowerCase());
                    expect(step.shopId).toEqual(shopData[shopIndex].shopId);
                    expect(step.account).toEqual(userWallets[userIndex].address);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.APPROVED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(purchase.purchaseId);
                    expect(step.currency).toEqual(purchase.currency.toLowerCase());
                    expect(step.shopId).toEqual(shopData[shopIndex].shopId);
                    expect(step.paidValue).toEqual(purchaseAmount);
                    break;
                default:
                    throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
            }
        }

        await ContractUtils.delay(3000);

        // Close New
        res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/new/close"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
            confirm: true,
            paymentId
        });
        assert.deepStrictEqual(res.code, 0);

        await ContractUtils.delay(2000);
    });

    it("Change point type to 'token'", async () => {
        for await (const step of client.ledger.changeToLoyaltyToken()) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.account).toEqual(userWallets[userIndex].address);
                    break;
                case NormalSteps.SENT:
                    expect(typeof step.txHash).toBe("string");
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.DONE:
                    expect(step.account).toBe(userWallets[userIndex].address);
                    break;
                default:
                    throw new Error("Unexpected change loyalty step: " + JSON.stringify(step, null, 2));
            }
        }
    });

    it("Deposit token - Success", async () => {
        const amount = Amount.make(20_000, 18);
        const signer = new NonceManager(userWallets[userIndex].connect(contractInfo.provider));

        let tx = await contractInfo.token
            .connect(accounts[AccountIndex.OWNER])
            .transfer(userWallets[userIndex].address, amount.value);
        await tx.wait();

        tx = await contractInfo.token.connect(signer).approve(contractInfo.ledger.address, amount.value);
        await tx.wait();

        tx = await contractInfo.ledger.connect(signer).deposit(amount.value);
        await tx.wait();
    });

    it("Set User & Shop", async () => {
        userIndex = 0;
        shopIndex = 2;
    });

    it("Pay token", async () => {
        const purchase: IPurchaseData = {
            purchaseId: "P000200",
            timestamp: 1672849000,
            amount: 500,
            method: 0,
            currency: "krw",
            shopIndex,
            userIndex
        };

        const purchaseAmount = Amount.make(purchase.amount, 18).value;

        client.useSigner(userWallets[purchase.userIndex]);

        // Open New
        let res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/new/open"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
            purchaseId: purchase.purchaseId,
            amount: purchaseAmount.toString(),
            currency: purchase.currency.toLowerCase(),
            shopId: shopData[shopIndex].shopId,
            account: userWallets[userIndex].address
        });
        assert.deepStrictEqual(res.code, 0);
        assert.notDeepStrictEqual(res.data, undefined);

        const paymentId = res.data.paymentId;

        await ContractUtils.delay(3000);

        // Approve New
        client.useSigner(userWallets[userIndex]);
        for await (const step of client.ledger.approveNewPayment(
            paymentId,
            purchase.purchaseId,
            purchaseAmount,
            purchase.currency.toLowerCase(),
            shopData[purchase.shopIndex].shopId,
            true
        )) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(purchase.purchaseId);
                    expect(step.amount).toEqual(purchaseAmount);
                    expect(step.currency).toEqual(purchase.currency.toLowerCase());
                    expect(step.shopId).toEqual(shopData[shopIndex].shopId);
                    expect(step.account).toEqual(userWallets[userIndex].address);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.APPROVED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(purchase.purchaseId);
                    expect(step.currency).toEqual(purchase.currency.toLowerCase());
                    expect(step.shopId).toEqual(shopData[shopIndex].shopId);
                    expect(step.paidValue).toEqual(purchaseAmount);
                    break;
                default:
                    throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
            }
        }

        await ContractUtils.delay(3000);

        // Close New
        res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/new/close"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
            confirm: true,
            paymentId
        });
        assert.deepStrictEqual(res.code, 0);

        await ContractUtils.delay(2000);
    });

    it("Check Settlement", async () => {
        shopIndex = 2;
        shop = shopData[shopIndex];
        amount2 = Amount.make(400, 18).value;
        const withdrawalAmount = await client.shop.getWithdrawableAmount(shop.shopId);
        expect(withdrawalAmount.toString()).toEqual(amount2.toString());
    });

    it("Check Withdraw Status - Before", async () => {
        const shopInfo = await client.shop.getShopInfo(shop.shopId);
        expect(shopInfo.withdrawStatus).toEqual(ShopWithdrawStatus.CLOSE);
    });

    it("Open Withdrawal", async () => {
        client.useSigner(shopWallets[shopIndex]);

        for await (const step of client.shop.openWithdrawal(shop.shopId, amount2)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.shopId).toEqual(shop.shopId);
                    expect(step.account.toUpperCase()).toEqual(shopWallets[shopIndex].address.toUpperCase());
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.shopId).toEqual(shop.shopId);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.DONE:
                    expect(step.shopId).toEqual(shop.shopId);
                    expect(step.amount.toString()).toEqual(amount2.toString());
                    expect(step.account.toUpperCase()).toEqual(shopWallets[shopIndex].address.toUpperCase());
                    break;
                default:
                    throw new Error("Unexpected open withdrawal step: " + JSON.stringify(step, null, 2));
            }
        }
    });

    it("Check Withdraw Status - Working", async () => {
        const shopInfo = await client.shop.getShopInfo(shop.shopId);
        expect(shopInfo.withdrawStatus).toEqual(ShopWithdrawStatus.OPEN);
        expect(shopInfo.withdrawAmount.toString()).toEqual(amount2.toString());
    });
    //
    // it("Close Withdrawal", async () => {
    //     client.useSigner(shopWallets[shopIndex]);
    //
    //     for await (const step of client.shop.closeWithdrawal(shop.shopId)) {
    //         switch (step.key) {
    //             case NormalSteps.PREPARED:
    //                 expect(step.shopId).toEqual(shop.shopId);
    //                 expect(step.account.toUpperCase()).toEqual(shopWallets[shopIndex].address.toUpperCase());
    //                 expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
    //                 break;
    //             case NormalSteps.SENT:
    //                 expect(step.shopId).toEqual(shop.shopId);
    //                 expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
    //                 break;
    //             case NormalSteps.DONE:
    //                 expect(step.shopId).toEqual(shop.shopId);
    //                 expect(step.amount.toString()).toEqual(amount2.toString());
    //                 expect(step.account.toUpperCase()).toEqual(shopWallets[shopIndex].address.toUpperCase());
    //                 break;
    //             default:
    //                 throw new Error("Unexpected close withdrawal step: " + JSON.stringify(step, null, 2));
    //         }
    //     }
    // });
    //
    // it("Check Withdraw Status - After", async () => {
    //     const shopInfo = await client.shop.getShopInfo(shop.shopId);
    //     expect(shopInfo.withdrawStatus).toEqual(ShopWithdrawStatus.CLOSE);
    // });
});
