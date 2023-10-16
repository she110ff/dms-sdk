import { Server } from "ganache";
import { GanacheServer } from "./helper/GanacheServer";
import * as deployContracts from "./helper/deployContracts";
import { purchaseData, shopData, userData } from "./helper/deployContracts";
import { contextParamsLocalChain } from "./helper/constants";
import {
    Amount,
    Client,
    Context,
    ContractUtils,
    DepositSteps,
    PayPointSteps,
    PayTokenSteps,
    WithdrawSteps
} from "../src";
import { FakerRelayServer } from "./helper/FakerRelayServer";
import { BigNumber } from "@ethersproject/bignumber";
import { Signer } from "@ethersproject/abstract-signer";
import { AddressZero } from "@ethersproject/constants";

describe("Client", () => {
    let node: Server;
    let deployment: deployContracts.Deployment;
    let fakerRelayServer: FakerRelayServer;
    const [, , , , validator1, , , user1] = GanacheServer.accounts();

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

    let signer: Signer;
    let userAddress: string;
    let phone: string;
    let phoneHash: string;
    beforeAll(async () => {
        signer = client.web3.getConnectedSigner();
        userAddress = await signer.getAddress();
        phone = userData[purchaseData[0].userIndex].phone;
        phoneHash = ContractUtils.getPhoneHash(phone);
    });

    it("Server Health Checking", async () => {
        const isUp = await client.methods.isRelayUp();
        expect(isUp).toEqual(true);
    });

    it("Save Purchase Data 1", async () => {
        const purchaseAmount = Amount.make(purchaseData[0].amount, 18).value.mul(1000);
        await deployment.ledger.connect(validator1).savePurchase({
            purchaseId: purchaseData[0].purchaseId,
            timestamp: purchaseData[0].timestamp,
            amount: purchaseAmount,
            currency: purchaseData[0].currency.toLowerCase(),
            shopId: shopData[purchaseData[0].shopIndex].shopId,
            method: purchaseData[0].method,
            account: AddressZero,
            phone: phoneHash
        });
    });

    it("Save Purchase Data 2", async () => {
        const purchaseAmount = Amount.make(purchaseData[0].amount, 18).value.mul(1000);
        await deployment.ledger.connect(validator1).savePurchase({
            purchaseId: purchaseData[0].purchaseId,
            timestamp: purchaseData[0].timestamp,
            amount: purchaseAmount,
            currency: purchaseData[0].currency.toLowerCase(),
            shopId: shopData[purchaseData[0].shopIndex].shopId,
            method: purchaseData[0].method,
            account: userAddress,
            phone: phoneHash
        });
    });

    it("Change point type to 'token'", async () => {
        const nonce = await deployment.ledger.nonceOf(userAddress);
        const signature = await ContractUtils.signPointType(signer, 1, nonce);
        await deployment.ledger.connect(validator1).setPointType(1, userAddress, signature);
    });

    it("Save Purchase Data 3", async () => {
        const purchaseAmount = Amount.make(purchaseData[0].amount, 18).value.mul(1000);
        await deployment.ledger.connect(validator1).savePurchase({
            purchaseId: purchaseData[0].purchaseId,
            timestamp: purchaseData[0].timestamp,
            amount: purchaseAmount,
            currency: purchaseData[0].currency.toLowerCase(),
            shopId: shopData[purchaseData[0].shopIndex].shopId,
            method: purchaseData[0].method,
            account: userAddress,
            phone: phoneHash
        });
    });

    const purchaseAmount = Amount.make(purchaseData[0].amount, 18).value.mul(1000);
    const pointAmount = purchaseAmount.div(100);
    const multiple = BigNumber.from(1000000000);
    const price = BigNumber.from(150).mul(multiple);
    const tokenAmount = pointAmount.mul(multiple).div(price);

    it("Balance Check - Test getting the unpayable point balance", async () => {
        const balance = await client.methods.getUnPayablePointBalance(phoneHash);
        expect(balance).toEqual(pointAmount);
    });

    it("Balance Check - Test getting the point balance", async () => {
        const balance = await client.methods.getPointBalance(userAddress);
        expect(balance).toEqual(pointAmount);
    });

    it("Balance Check - Test getting the token balance", async () => {
        const balance = await client.methods.getTokenBalance(userAddress);
        expect(balance).toEqual(tokenAmount);
    });

    it("Test of pay point", async () => {
        const purchase = purchaseData[0];
        const amount = Amount.make(purchase.amount / 10, 18);
        const option = await client.methods.getPayPointOption(
            purchase.purchaseId,
            amount.value,
            purchase.currency.toLowerCase(),
            shopData[purchase.shopIndex].shopId
        );

        for await (const step of client.methods.fetchPayPoint(option)) {
            switch (step.key) {
                case PayPointSteps.PAYING_POINT:
                    expect(typeof step.txHash).toBe("string");
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case PayPointSteps.DONE:
                    expect(step.amount instanceof BigNumber).toBe(true);
                    expect(step.amount.toString()).toBe(amount.toString());
                    break;
                default:
                    throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
            }
        }
    });

    it("Test of pay token", async () => {
        const purchase = purchaseData[0];
        const amount = Amount.make(purchase.amount, 18);
        const option = await client.methods.getPayTokenOption(
            purchase.purchaseId,
            amount.value,
            purchase.currency.toLowerCase(),
            shopData[purchase.shopIndex].shopId
        );

        for await (const step of client.methods.fetchPayToken(option)) {
            switch (step.key) {
                case PayTokenSteps.PAYING_TOKEN:
                    expect(typeof step.txHash).toBe("string");
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case PayTokenSteps.DONE:
                    expect(step.amount instanceof BigNumber).toBe(true);
                    expect(step.amount.toString()).toBe(amount.toString());
                    break;
                default:
                    throw new Error("Unexpected pay token step: " + JSON.stringify(step, null, 2));
            }
        }
    });

    const tradeAmount = 10_000;
    const amountToTrade = Amount.make(tradeAmount, 18);

    it("Test of the deposit", async () => {
        const beforeBalance = await deployment.ledger.tokenBalanceOf(userAddress);

        for await (const step of client.methods.deposit(amountToTrade.value)) {
            switch (step.key) {
                case DepositSteps.CHECKED_ALLOWANCE:
                    expect(step.allowance instanceof BigNumber).toBe(true);
                    expect(step.allowance.toString()).toBe("0");
                    break;
                case DepositSteps.UPDATING_ALLOWANCE:
                    expect(typeof step.txHash).toBe("string");
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case DepositSteps.UPDATED_ALLOWANCE:
                    expect(step.allowance instanceof BigNumber).toBe(true);
                    expect(step.allowance.toString()).toBe(amountToTrade.toString());
                    break;
                case DepositSteps.DEPOSITING:
                    expect(typeof step.txHash).toBe("string");
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case DepositSteps.DONE:
                    expect(step.amount instanceof BigNumber).toBe(true);
                    expect(step.amount.toString()).toBe(amountToTrade.toString());
                    break;
                default:
                    throw new Error("Unexpected deposit step: " + JSON.stringify(step, null, 2));
            }
        }

        const afterBalance = await deployment.ledger.tokenBalanceOf(userAddress);
        expect(afterBalance.toString()).toEqual(beforeBalance.add(amountToTrade.value).toString());
    });

    it("Test of the withdraw", async () => {
        const beforeBalance = await deployment.ledger.tokenBalanceOf(userAddress);

        for await (const step of client.methods.withdraw(amountToTrade.value)) {
            switch (step.key) {
                case WithdrawSteps.WITHDRAWING:
                    expect(typeof step.txHash).toBe("string");
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case WithdrawSteps.DONE:
                    expect(step.amount instanceof BigNumber).toBe(true);
                    expect(step.amount.toString()).toBe(amountToTrade.toString());
                    break;
                default:
                    throw new Error("Unexpected withdraw step: " + JSON.stringify(step, null, 2));
            }
        }

        const afterBalance = await deployment.ledger.tokenBalanceOf(userAddress);
        expect(afterBalance.toString()).toEqual(beforeBalance.sub(amountToTrade.value).toString());
    });
});
