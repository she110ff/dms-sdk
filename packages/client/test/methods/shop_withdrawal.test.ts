import { Server } from "ganache";
import { GanacheServer } from "../helper/GanacheServer";
import * as deployContracts from "../helper/deployContracts";
import { shopData, IShopData, IPurchaseData, IUserData } from "../helper/deployContracts";
import { contextParamsLocalChain } from "../helper/constants";
import { Amount, Client, Context, ContractUtils, NormalSteps, WithdrawStatus } from "../../src";
import { FakerRelayServer } from "../helper/FakerRelayServer";
import { BigNumber } from "@ethersproject/bignumber";

describe("Shop Withdrawal", () => {
    describe("Use Relay", () => {
        let node: Server;
        let deployment: deployContracts.Deployment;
        let fakerRelayServer: FakerRelayServer;
        const [
            ,
            ,
            ,
            ,
            validator1,
            validator2,
            validator3,
            user1,
            user2,
            user3,
            user4,
            user5,
            shop1,
            shop2,
            shop3,
            shop4,
            shop5,
            shop6
        ] = GanacheServer.accounts();

        const validatorWallets = [validator1, validator2, validator3];
        const userWallets = [user1, user2, user3, user4, user5];
        const shopWallets = [shop1, shop2, shop3, shop4, shop5, shop6];

        let shop: IShopData;
        let shopIndex: number;
        let amount2: BigNumber;

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

            GanacheServer.setTestWeb3Signer(user1);

            fakerRelayServer = new FakerRelayServer(7070, deployment);
            await fakerRelayServer.start();
        });

        afterAll(async () => {
            await node.close();
            await fakerRelayServer.stop();
        });

        let client: Client;
        beforeAll(async () => {
            const ctx = new Context(contextParamsLocalChain);
            client = new Client(ctx);
        });

        it("Server Health Checking", async () => {
            const isUp = await client.ledger.isRelayUp();
            expect(isUp).toEqual(true);
        });

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

        it("Save Purchase Data", async () => {
            for (const purchase of purchaseData) {
                const phoneHash = ContractUtils.getPhoneHash(userData[purchase.userIndex].phone);
                const purchaseAmount = Amount.make(purchase.amount, 18).value;
                const userAccount = userData[purchase.userIndex].address.trim();
                await deployment.ledger.connect(validatorWallets[0]).savePurchase({
                    purchaseId: purchase.purchaseId,
                    timestamp: purchase.timestamp,
                    amount: purchaseAmount,
                    currency: purchase.currency.toLowerCase(),
                    shopId: shopData[purchase.shopIndex].shopId,
                    method: purchase.method,
                    account: userAccount,
                    phone: phoneHash
                });
            }
        });

        it("Check shop data", async () => {
            const shopInfo1 = await client.shop.getShopInfo(shopData[0].shopId);
            expect(shopInfo1.providedPoint.toString()).toEqual(
                Amount.make(10000 * 3, 18)
                    .value.mul(shopData[0].providePercent)
                    .div(100)
                    .toString()
            );

            const shopInfo2 = await client.shop.getShopInfo(shopData[1].shopId);
            expect(shopInfo2.providedPoint.toString()).toEqual(
                Amount.make(10000 * 1, 18)
                    .value.mul(shopData[1].providePercent)
                    .div(100)
                    .toString()
            );
            const shopInfo3 = await client.shop.getShopInfo(shopData[2].shopId);
            expect(shopInfo3.providedPoint.toString()).toEqual(
                Amount.make(10000 * 1, 18)
                    .value.mul(shopData[2].providePercent)
                    .div(100)
                    .toString()
            );
            const shopInfo4 = await client.shop.getShopInfo(shopData[3].shopId);
            expect(shopInfo4.providedPoint.toString()).toEqual(
                Amount.make(10000 * 1, 18)
                    .value.mul(shopData[3].providePercent)
                    .div(100)
                    .toString()
            );
        });

        it("Pay point", async () => {
            const purchase = {
                purchaseId: "P000100",
                timestamp: 1672849000,
                amount: 300,
                method: 0,
                currency: "krw",
                shopIndex: 1,
                userIndex: 0
            };

            const purchaseAmount = Amount.make(purchase.amount, 18).value;

            client.useSigner(userWallets[purchase.userIndex]);

            for await (const step of client.ledger.payPoint(
                purchase.purchaseId,
                purchaseAmount,
                purchase.currency.toLowerCase(),
                shopData[purchase.shopIndex].shopId
            )) {
                switch (step.key) {
                    case NormalSteps.PREPARED:
                        expect(step.purchaseId).toEqual(purchase.purchaseId);
                        expect(step.amount.toString()).toEqual(purchaseAmount.toString());
                        expect(step.currency).toEqual(purchase.currency.toLowerCase());
                        expect(step.shopId).toEqual(shopData[purchase.shopIndex].shopId);
                        expect(step.account.toUpperCase()).toEqual(
                            userWallets[purchase.userIndex].address.toUpperCase()
                        );
                        expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                        break;
                    case NormalSteps.SENT:
                        expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        break;
                    case NormalSteps.DONE:
                        expect(step.purchaseId).toEqual(purchase.purchaseId);
                        expect(step.currency).toEqual(purchase.currency.toLowerCase());
                        expect(step.shopId).toEqual(shopData[purchase.shopIndex].shopId);
                        expect(step.paidValue.toString()).toEqual(purchaseAmount.toString());
                        break;
                    default:
                        throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
                }
            }
        });

        it("Deposit token - Success", async () => {
            const amount = Amount.make(20_000, 18);
            await deployment.token.connect(userWallets[0]).approve(deployment.ledger.address, amount.value);
            await deployment.ledger.connect(userWallets[0]).deposit(amount.value);
        });

        it("Pay token", async () => {
            const purchase: IPurchaseData = {
                purchaseId: "P000200",
                timestamp: 1672849000,
                amount: 500,
                method: 0,
                currency: "krw",
                shopIndex: 2,
                userIndex: 0
            };

            const purchaseAmount = Amount.make(purchase.amount, 18).value;

            client.useSigner(userWallets[purchase.userIndex]);

            for await (const step of client.ledger.payToken(
                purchase.purchaseId,
                purchaseAmount,
                purchase.currency.toLowerCase(),
                shopData[purchase.shopIndex].shopId
            )) {
                switch (step.key) {
                    case NormalSteps.PREPARED:
                        expect(step.purchaseId).toEqual(purchase.purchaseId);
                        expect(step.amount.toString()).toEqual(purchaseAmount.toString());
                        expect(step.currency).toEqual(purchase.currency.toLowerCase());
                        expect(step.shopId).toEqual(shopData[purchase.shopIndex].shopId);
                        expect(step.account.toUpperCase()).toEqual(
                            userWallets[purchase.userIndex].address.toUpperCase()
                        );
                        expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                        break;
                    case NormalSteps.SENT:
                        expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        break;
                    case NormalSteps.DONE:
                        expect(step.purchaseId).toEqual(purchase.purchaseId);
                        expect(step.currency).toEqual(purchase.currency.toLowerCase());
                        expect(step.shopId).toEqual(shopData[purchase.shopIndex].shopId);
                        expect(step.paidValue.toString()).toEqual(purchaseAmount.toString());
                        break;
                    default:
                        throw new Error("Unexpected pay token step: " + JSON.stringify(step, null, 2));
                }
            }
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
            expect(shopInfo.withdrawStatus).toEqual(WithdrawStatus.CLOSE);
        });

        it("Open Withdrawal", async () => {
            client.useSigner(shopWallets[shopIndex]);

            for await (const step of client.shop.openWithdrawal(shop.shopId, amount2)) {
                switch (step.key) {
                    case NormalSteps.PREPARED:
                        expect(step.shopId).toEqual(shop.shopId);
                        expect(step.account.toUpperCase()).toEqual(shopWallets[2].address.toUpperCase());
                        expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                        break;
                    case NormalSteps.SENT:
                        expect(step.shopId).toEqual(shop.shopId);
                        expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        break;
                    case NormalSteps.DONE:
                        expect(step.shopId).toEqual(shop.shopId);
                        expect(step.amount.toString()).toEqual(amount2.toString());
                        expect(step.account.toUpperCase()).toEqual(shopWallets[2].address.toUpperCase());
                        break;
                    default:
                        throw new Error("Unexpected open withdrawal step: " + JSON.stringify(step, null, 2));
                }
            }
        });

        it("Check Withdraw Status - Working", async () => {
            const shopInfo = await client.shop.getShopInfo(shop.shopId);
            expect(shopInfo.withdrawStatus).toEqual(WithdrawStatus.OPEN);
            expect(shopInfo.withdrawAmount.toString()).toEqual(amount2.toString());
        });

        it("Close Withdrawal", async () => {
            client.useSigner(shopWallets[shopIndex]);

            for await (const step of client.shop.closeWithdrawal(shop.shopId)) {
                switch (step.key) {
                    case NormalSteps.PREPARED:
                        expect(step.shopId).toEqual(shop.shopId);
                        expect(step.account.toUpperCase()).toEqual(shopWallets[2].address.toUpperCase());
                        expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                        break;
                    case NormalSteps.SENT:
                        expect(step.shopId).toEqual(shop.shopId);
                        expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        break;
                    case NormalSteps.DONE:
                        expect(step.shopId).toEqual(shop.shopId);
                        expect(step.amount.toString()).toEqual(amount2.toString());
                        expect(step.account.toUpperCase()).toEqual(shopWallets[2].address.toUpperCase());
                        break;
                    default:
                        throw new Error("Unexpected close withdrawal step: " + JSON.stringify(step, null, 2));
                }
            }
        });

        it("Check Withdraw Status - After", async () => {
            const shopInfo = await client.shop.getShopInfo(shop.shopId);
            expect(shopInfo.withdrawStatus).toEqual(WithdrawStatus.CLOSE);
        });
    });

    describe("Not Use Relay", () => {
        let node: Server;
        let deployment: deployContracts.Deployment;
        let fakerRelayServer: FakerRelayServer;
        const [
            ,
            ,
            ,
            ,
            validator1,
            validator2,
            validator3,
            user1,
            user2,
            user3,
            user4,
            user5,
            shop1,
            shop2,
            shop3,
            shop4,
            shop5,
            shop6
        ] = GanacheServer.accounts();

        const validatorWallets = [validator1, validator2, validator3];
        const userWallets = [user1, user2, user3, user4, user5];
        const shopWallets = [shop1, shop2, shop3, shop4, shop5, shop6];

        let shop: IShopData;
        let shopIndex: number;
        let amount2: BigNumber;

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

            GanacheServer.setTestWeb3Signer(user1);

            fakerRelayServer = new FakerRelayServer(7070, deployment);
            await fakerRelayServer.start();
        });

        afterAll(async () => {
            await node.close();
            await fakerRelayServer.stop();
        });

        let client: Client;
        beforeAll(async () => {
            const ctx = new Context(contextParamsLocalChain);
            client = new Client(ctx);
        });

        it("Server Health Checking", async () => {
            const isUp = await client.ledger.isRelayUp();
            expect(isUp).toEqual(true);
        });

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

        it("Save Purchase Data", async () => {
            for (const purchase of purchaseData) {
                const phoneHash = ContractUtils.getPhoneHash(userData[purchase.userIndex].phone);
                const purchaseAmount = Amount.make(purchase.amount, 18).value;
                const userAccount = userData[purchase.userIndex].address.trim();
                await deployment.ledger.connect(validatorWallets[0]).savePurchase({
                    purchaseId: purchase.purchaseId,
                    timestamp: purchase.timestamp,
                    amount: purchaseAmount,
                    currency: purchase.currency.toLowerCase(),
                    shopId: shopData[purchase.shopIndex].shopId,
                    method: purchase.method,
                    account: userAccount,
                    phone: phoneHash
                });
            }
        });

        it("Check shop data", async () => {
            const shopInfo1 = await client.shop.getShopInfo(shopData[0].shopId);
            expect(shopInfo1.providedPoint.toString()).toEqual(
                Amount.make(10000 * 3, 18)
                    .value.mul(shopData[0].providePercent)
                    .div(100)
                    .toString()
            );

            const shopInfo2 = await client.shop.getShopInfo(shopData[1].shopId);
            expect(shopInfo2.providedPoint.toString()).toEqual(
                Amount.make(10000 * 1, 18)
                    .value.mul(shopData[1].providePercent)
                    .div(100)
                    .toString()
            );
            const shopInfo3 = await client.shop.getShopInfo(shopData[2].shopId);
            expect(shopInfo3.providedPoint.toString()).toEqual(
                Amount.make(10000 * 1, 18)
                    .value.mul(shopData[2].providePercent)
                    .div(100)
                    .toString()
            );
            const shopInfo4 = await client.shop.getShopInfo(shopData[3].shopId);
            expect(shopInfo4.providedPoint.toString()).toEqual(
                Amount.make(10000 * 1, 18)
                    .value.mul(shopData[3].providePercent)
                    .div(100)
                    .toString()
            );
        });

        it("Pay point", async () => {
            const purchase = {
                purchaseId: "P000100",
                timestamp: 1672849000,
                amount: 300,
                method: 0,
                currency: "krw",
                shopIndex: 1,
                userIndex: 0
            };

            const purchaseAmount = Amount.make(purchase.amount, 18).value;

            client.useSigner(userWallets[purchase.userIndex]);

            for await (const step of client.ledger.payPoint(
                purchase.purchaseId,
                purchaseAmount,
                purchase.currency.toLowerCase(),
                shopData[purchase.shopIndex].shopId,
                false
            )) {
                switch (step.key) {
                    case NormalSteps.PREPARED:
                        expect(step.purchaseId).toEqual(purchase.purchaseId);
                        expect(step.amount.toString()).toEqual(purchaseAmount.toString());
                        expect(step.currency).toEqual(purchase.currency.toLowerCase());
                        expect(step.shopId).toEqual(shopData[purchase.shopIndex].shopId);
                        expect(step.account.toUpperCase()).toEqual(
                            userWallets[purchase.userIndex].address.toUpperCase()
                        );
                        expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                        break;
                    case NormalSteps.SENT:
                        expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        break;
                    case NormalSteps.DONE:
                        expect(step.purchaseId).toEqual(purchase.purchaseId);
                        expect(step.currency).toEqual(purchase.currency.toLowerCase());
                        expect(step.shopId).toEqual(shopData[purchase.shopIndex].shopId);
                        expect(step.paidValue.toString()).toEqual(purchaseAmount.toString());
                        break;
                    default:
                        throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
                }
            }
        });

        it("Deposit token - Success", async () => {
            const amount = Amount.make(20_000, 18);
            await deployment.token.connect(userWallets[0]).approve(deployment.ledger.address, amount.value);
            await deployment.ledger.connect(userWallets[0]).deposit(amount.value);
        });

        it("Pay token", async () => {
            const purchase: IPurchaseData = {
                purchaseId: "P000200",
                timestamp: 1672849000,
                amount: 500,
                method: 0,
                currency: "krw",
                shopIndex: 2,
                userIndex: 0
            };

            const purchaseAmount = Amount.make(purchase.amount, 18).value;

            client.useSigner(userWallets[purchase.userIndex]);

            for await (const step of client.ledger.payToken(
                purchase.purchaseId,
                purchaseAmount,
                purchase.currency.toLowerCase(),
                shopData[purchase.shopIndex].shopId,
                false
            )) {
                switch (step.key) {
                    case NormalSteps.PREPARED:
                        expect(step.purchaseId).toEqual(purchase.purchaseId);
                        expect(step.amount.toString()).toEqual(purchaseAmount.toString());
                        expect(step.currency).toEqual(purchase.currency.toLowerCase());
                        expect(step.shopId).toEqual(shopData[purchase.shopIndex].shopId);
                        expect(step.account.toUpperCase()).toEqual(
                            userWallets[purchase.userIndex].address.toUpperCase()
                        );
                        expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                        break;
                    case NormalSteps.SENT:
                        expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        break;
                    case NormalSteps.DONE:
                        expect(step.purchaseId).toEqual(purchase.purchaseId);
                        expect(step.currency).toEqual(purchase.currency.toLowerCase());
                        expect(step.shopId).toEqual(shopData[purchase.shopIndex].shopId);
                        expect(step.paidValue.toString()).toEqual(purchaseAmount.toString());
                        break;
                    default:
                        throw new Error("Unexpected pay token step: " + JSON.stringify(step, null, 2));
                }
            }
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
            expect(shopInfo.withdrawStatus).toEqual(WithdrawStatus.CLOSE);
        });

        it("Open Withdrawal", async () => {
            client.useSigner(shopWallets[shopIndex]);

            for await (const step of client.shop.openWithdrawal(shop.shopId, amount2, false)) {
                switch (step.key) {
                    case NormalSteps.PREPARED:
                        expect(step.shopId).toEqual(shop.shopId);
                        expect(step.account.toUpperCase()).toEqual(shopWallets[2].address.toUpperCase());
                        expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                        break;
                    case NormalSteps.SENT:
                        expect(step.shopId).toEqual(shop.shopId);
                        expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        break;
                    case NormalSteps.DONE:
                        expect(step.shopId).toEqual(shop.shopId);
                        expect(step.amount.toString()).toEqual(amount2.toString());
                        expect(step.account.toUpperCase()).toEqual(shopWallets[2].address.toUpperCase());
                        break;
                    default:
                        throw new Error("Unexpected open withdrawal step: " + JSON.stringify(step, null, 2));
                }
            }
        });

        it("Check Withdraw Status - Working", async () => {
            const shopInfo = await client.shop.getShopInfo(shop.shopId);
            expect(shopInfo.withdrawStatus).toEqual(WithdrawStatus.OPEN);
            expect(shopInfo.withdrawAmount.toString()).toEqual(amount2.toString());
        });

        it("Close Withdrawal", async () => {
            client.useSigner(shopWallets[shopIndex]);

            for await (const step of client.shop.closeWithdrawal(shop.shopId, false)) {
                switch (step.key) {
                    case NormalSteps.PREPARED:
                        expect(step.shopId).toEqual(shop.shopId);
                        expect(step.account.toUpperCase()).toEqual(shopWallets[2].address.toUpperCase());
                        expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                        break;
                    case NormalSteps.SENT:
                        expect(step.shopId).toEqual(shop.shopId);
                        expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        break;
                    case NormalSteps.DONE:
                        expect(step.shopId).toEqual(shop.shopId);
                        expect(step.amount.toString()).toEqual(amount2.toString());
                        expect(step.account.toUpperCase()).toEqual(shopWallets[2].address.toUpperCase());
                        break;
                    default:
                        throw new Error("Unexpected close withdrawal step: " + JSON.stringify(step, null, 2));
                }
            }
        });

        it("Check Withdraw Status - After", async () => {
            const shopInfo = await client.shop.getShopInfo(shop.shopId);
            expect(shopInfo.withdrawStatus).toEqual(WithdrawStatus.CLOSE);
        });
    });
});
