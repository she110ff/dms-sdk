import { Server } from "ganache";
import { AccountIndex, GanacheServer } from "../helper/GanacheServer";
import { ContractDeployer, Deployment, purchaseData, shopData, userData } from "../helper/ContractDeployer";
import { contextParamsLocalChain } from "../helper/constants";
import {
    Amount,
    Client,
    Context,
    ContractUtils,
    DepositSteps,
    LoyaltyType,
    NormalSteps,
    WithdrawSteps
} from "../../src";
import { FakerRelayServer } from "../helper/FakerRelayServer";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { AddressZero } from "@ethersproject/constants";
import { Network } from "../../src/client-common/interfaces/network";

import * as assert from "assert";

describe("Ledger", () => {
    let node: Server;
    let deployment: Deployment;
    let fakerRelayServer: FakerRelayServer;
    const accounts = GanacheServer.accounts();
    const validatorWallets = [
        accounts[AccountIndex.VALIDATOR1],
        accounts[AccountIndex.VALIDATOR2],
        accounts[AccountIndex.VALIDATOR3]
    ];
    const userWallets = [
        accounts[AccountIndex.USER1],
        accounts[AccountIndex.USER2],
        accounts[AccountIndex.USER3],
        accounts[AccountIndex.USER4],
        accounts[AccountIndex.USER5]
    ];
    const shopWallets = [
        accounts[AccountIndex.SHOP1],
        accounts[AccountIndex.SHOP2],
        accounts[AccountIndex.SHOP3],
        accounts[AccountIndex.SHOP4],
        accounts[AccountIndex.SHOP5],
        accounts[AccountIndex.SHOP6]
    ];
    beforeAll(async () => {
        node = await GanacheServer.start();

        deployment = await ContractDeployer.deploy();

        GanacheServer.setTestWeb3Signer(userWallets[0]);

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
        const isUp = await client.ledger.isRelayUp();
        expect(isUp).toEqual(true);
    });

    it("Save Purchase Data 1", async () => {
        const purchaseAmount = Amount.make(purchaseData[0].amount, 18).value.mul(1000);
        await deployment.ledger.connect(validatorWallets[0]).savePurchase({
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
        await deployment.ledger.connect(validatorWallets[1]).savePurchase({
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
    const tokenAmount = BigNumber.from(0);

    it("Balance Check - Test getting the unpayable point balance", async () => {
        const balance = await client.ledger.getUnPayablePointBalance(phoneHash);
        expect(balance).toEqual(pointAmount);
    });

    it("Balance Check - Test getting the point balance", async () => {
        const balance = await client.ledger.getPointBalance(userAddress);
        expect(balance).toEqual(pointAmount);
    });

    it("Balance Check - Test getting the token balance", async () => {
        const balance = await client.ledger.getTokenBalance(userAddress);
        expect(balance).toEqual(tokenAmount);
    });

    it("Link phone-wallet", async () => {
        const nonce = await deployment.phoneLinkCollection.nonceOf(userAddress);
        const signature = await ContractUtils.signRequestHash(signer, phoneHash, nonce);
        const requestId = ContractUtils.getRequestId(phoneHash, userAddress, nonce);
        //Add Phone
        await deployment.phoneLinkCollection.connect(signer).addRequest(requestId, phoneHash, userAddress, signature);
        // Vote
        await deployment.phoneLinkCollection.connect(validatorWallets[0]).voteRequest(requestId);
        await deployment.phoneLinkCollection.connect(validatorWallets[1]).voteRequest(requestId);
        await deployment.phoneLinkCollection.connect(validatorWallets[0]).countVote(requestId);
    });

    it("Change to Payable Point", async () => {
        const unPayableBalance1 = await client.ledger.getUnPayablePointBalance(phoneHash);
        const payableBalance1 = await client.ledger.getPointBalance(userAddress);

        for await (const step of client.ledger.changeToPayablePoint(phone)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.phone).toEqual(phone);
                    expect(step.phoneHash).toEqual(phoneHash);
                    expect(step.account).toEqual(userAddress);
                    expect(step.balance).toEqual(unPayableBalance1);
                    break;
                case NormalSteps.SENT:
                    expect(typeof step.txHash).toBe("string");
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.DONE:
                    break;
                default:
                    throw new Error("Unexpected change payable point step: " + JSON.stringify(step, null, 2));
            }
        }
        const payableBalance2 = await client.ledger.getPointBalance(userAddress);
        expect(payableBalance2.toString()).toEqual(payableBalance1.add(unPayableBalance1).toString());
    });

    it("Test for point's payment", async () => {
        const oldBalance = await client.ledger.getPointBalance(userAddress);
        const purchase = {
            purchaseId: "P000001",
            timestamp: 1672844400,
            amount: 1000,
            method: 0,
            currency: "krw",
            shopIndex: 0,
            userIndex: 0
        };
        const amount = Amount.make(purchase.amount, 18);

        const feeRate = await client.ledger.getFeeRate();
        const paidPoint = await client.currency.currencyToPoint(amount.value, purchase.currency);
        const feePoint = await client.currency.currencyToPoint(amount.value.mul(feeRate).div(100), purchase.currency);

        // Open New
        let res = await Network.post(new URL("http://localhost:7070/v1/payment/new/open"), {
            accessKey: FakerRelayServer.ACCESS_KEY,
            purchaseId: purchase.purchaseId,
            amount: amount.toString(),
            currency: purchase.currency.toLowerCase(),
            shopId: shopData[purchase.shopIndex].shopId,
            account: userWallets[0].address
        });
        assert.deepStrictEqual(res.code, 0);
        assert.notDeepStrictEqual(res.data, undefined);

        const paymentId = res.data.paymentId;

        await ContractUtils.delay(3000);

        let detail = await client.ledger.getPaymentDetail(paymentId);

        // Approve New
        client.useSigner(userWallets[0]);
        for await (const step of client.ledger.approveNewPayment(
            paymentId,
            detail.purchaseId,
            amount.value,
            detail.currency.toLowerCase(),
            detail.shopId,
            true
        )) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(detail.purchaseId);
                    expect(step.amount).toEqual(amount.value);
                    expect(step.currency).toEqual(detail.currency.toLowerCase());
                    expect(step.shopId).toEqual(detail.shopId);
                    expect(step.account).toEqual(userWallets[0].address);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.APPROVED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(detail.purchaseId);
                    expect(step.currency).toEqual(detail.currency.toLowerCase());
                    expect(step.shopId).toEqual(detail.shopId);
                    expect(step.paidPoint).toEqual(paidPoint);
                    expect(step.paidValue).toEqual(amount.value);
                    expect(step.feePoint).toEqual(feePoint);
                    break;
                default:
                    throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
            }
        }

        await ContractUtils.delay(3000);

        // Close New
        res = await Network.post(new URL("http://localhost:7070/v1/payment/new/close"), {
            accessKey: FakerRelayServer.ACCESS_KEY,
            confirm: true,
            paymentId
        });
        assert.deepStrictEqual(res.code, 0);

        await ContractUtils.delay(2000);

        assert.deepStrictEqual(
            await client.ledger.getPointBalance(userAddress),
            oldBalance.sub(paidPoint).sub(feePoint)
        );

        // Open Cancel
        res = await Network.post(new URL("http://localhost:7070/v1/payment/cancel/open"), {
            accessKey: FakerRelayServer.ACCESS_KEY,
            paymentId
        });
        assert.deepStrictEqual(res.code, 0);
        assert.notDeepStrictEqual(res.data, undefined);

        detail = await client.ledger.getPaymentDetail(paymentId);

        // Approve Cancel
        client.useSigner(shopWallets[0]);
        for await (const step of client.ledger.approveCancelPayment(paymentId, purchase.purchaseId, true)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(purchase.purchaseId);
                    expect(step.approval).toEqual(true);
                    expect(step.account).toEqual(shopWallets[0].address);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(detail.purchaseId);
                    expect(step.approval).toEqual(true);
                    expect(step.account).toEqual(shopWallets[0].address);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.APPROVED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(detail.purchaseId);
                    expect(step.approval).toEqual(true);
                    expect(step.account).toEqual(userWallets[0].address);
                    break;
                default:
                    throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
            }
        }

        await ContractUtils.delay(1000);

        // Close Cancel
        res = await Network.post(new URL("http://localhost:7070/v1/payment/cancel/close"), {
            accessKey: FakerRelayServer.ACCESS_KEY,
            confirm: true,
            paymentId
        });
        assert.deepStrictEqual(res.code, 0);

        await ContractUtils.delay(1000);

        assert.deepStrictEqual(await client.ledger.getPointBalance(userAddress), oldBalance);

        client.useSigner(userWallets[0]);
    });

    it("Change point type to 'token'", async () => {
        const balancePoint = await client.ledger.getPointBalance(userAddress);
        const multiple = BigNumber.from(1_000_000_000);
        const price = BigNumber.from(150).mul(multiple);
        const tokenAmount = balancePoint.mul(multiple).div(price);

        for await (const step of client.ledger.changeToLoyaltyToken()) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.account).toEqual(userAddress);
                    break;
                case NormalSteps.SENT:
                    expect(typeof step.txHash).toBe("string");
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.DONE:
                    expect(step.account).toBe(userWallets[0].address);
                    break;
                default:
                    throw new Error("Unexpected change loyalty step: " + JSON.stringify(step, null, 2));
            }
        }
        const type = await client.ledger.getLoyaltyType(userAddress);
        expect(type).toBe(LoyaltyType.TOKEN);

        const balance = await client.ledger.getTokenBalance(userAddress);
        expect(balance).toEqual(tokenAmount);
    });

    it("Test for token's payment", async () => {
        const oldBalance = await client.ledger.getTokenBalance(userAddress);
        const purchase = {
            purchaseId: "P000001",
            timestamp: 1672844400,
            amount: 1000,
            method: 0,
            currency: "krw",
            shopIndex: 0,
            userIndex: 0
        };
        const amount = Amount.make(purchase.amount, 18);

        const feeRate = await client.ledger.getFeeRate();
        const paidPoint = await client.currency.currencyToPoint(amount.value, purchase.currency);
        const feePoint = await client.currency.currencyToPoint(amount.value.mul(feeRate).div(100), purchase.currency);

        const paidToken = await client.currency.pointToToken(paidPoint);
        const feeToken = await client.currency.pointToToken(feePoint);

        // Open New
        let res = await Network.post(new URL("http://localhost:7070/v1/payment/new/open"), {
            accessKey: FakerRelayServer.ACCESS_KEY,
            purchaseId: purchase.purchaseId,
            amount: amount.toString(),
            currency: purchase.currency.toLowerCase(),
            shopId: shopData[purchase.shopIndex].shopId,
            account: userWallets[0].address
        });
        assert.deepStrictEqual(res.code, 0);
        assert.notDeepStrictEqual(res.data, undefined);

        const paymentId = res.data.paymentId;

        await ContractUtils.delay(3000);

        let detail = await client.ledger.getPaymentDetail(paymentId);

        // Approve New
        client.useSigner(userWallets[0]);
        for await (const step of client.ledger.approveNewPayment(
            paymentId,
            detail.purchaseId,
            amount.value,
            detail.currency.toLowerCase(),
            detail.shopId,
            true
        )) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(detail.purchaseId);
                    expect(step.amount).toEqual(amount.value);
                    expect(step.currency).toEqual(detail.currency.toLowerCase());
                    expect(step.shopId).toEqual(detail.shopId);
                    expect(step.account).toEqual(userWallets[0].address);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.APPROVED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(detail.purchaseId);
                    expect(step.currency).toEqual(detail.currency.toLowerCase());
                    expect(step.shopId).toEqual(detail.shopId);
                    expect(step.paidToken).toEqual(paidToken);
                    expect(step.paidValue).toEqual(amount.value);
                    expect(step.feeToken).toEqual(feeToken);
                    break;
                default:
                    throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
            }
        }

        await ContractUtils.delay(3000);

        // Close New
        res = await Network.post(new URL("http://localhost:7070/v1/payment/new/close"), {
            accessKey: FakerRelayServer.ACCESS_KEY,
            confirm: true,
            paymentId
        });
        assert.deepStrictEqual(res.code, 0);

        await ContractUtils.delay(2000);

        assert.deepStrictEqual(
            await client.ledger.getTokenBalance(userAddress),
            oldBalance.sub(paidToken).sub(feeToken)
        );

        // Open Cancel
        res = await Network.post(new URL("http://localhost:7070/v1/payment/cancel/open"), {
            accessKey: FakerRelayServer.ACCESS_KEY,
            paymentId
        });
        assert.deepStrictEqual(res.code, 0);
        assert.notDeepStrictEqual(res.data, undefined);

        await ContractUtils.delay(2000);

        detail = await client.ledger.getPaymentDetail(paymentId);

        // Approve Cancel
        client.useSigner(shopWallets[0]);
        for await (const step of client.ledger.approveCancelPayment(paymentId, purchase.purchaseId, true)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(detail.purchaseId);
                    expect(step.approval).toEqual(true);
                    expect(step.account).toEqual(shopWallets[0].address);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(detail.purchaseId);
                    expect(step.approval).toEqual(true);
                    expect(step.account).toEqual(shopWallets[0].address);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.APPROVED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(detail.purchaseId);
                    expect(step.approval).toEqual(true);
                    expect(step.account).toEqual(userWallets[0].address);
                    break;
                default:
                    throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
            }
        }

        await ContractUtils.delay(1000);

        // Close Cancel
        res = await Network.post(new URL("http://localhost:7070/v1/payment/cancel/close"), {
            accessKey: FakerRelayServer.ACCESS_KEY,
            confirm: true,
            paymentId
        });
        assert.deepStrictEqual(res.code, 0);

        await ContractUtils.delay(1000);

        assert.deepStrictEqual(await client.ledger.getTokenBalance(userAddress), oldBalance);

        client.useSigner(userWallets[0]);
    });

    const tradeAmount = 10_000;
    const amountToTrade = Amount.make(tradeAmount, 18);

    it("Test of the deposit", async () => {
        const beforeBalance = await deployment.ledger.tokenBalanceOf(userAddress);

        for await (const step of client.ledger.deposit(amountToTrade.value)) {
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

        for await (const step of client.ledger.withdraw(amountToTrade.value)) {
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

    it("Register Mobile Token", async () => {
        const token = "12345678901234567890123456789012345678901234567890";
        const language = "kr";
        const os = "iOS";
        await client.ledger.registerMobileToken(token, language, os);
    });
});
