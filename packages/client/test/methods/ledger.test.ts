import { AccountIndex, NodeInfo } from "../helper/NodeInfo";
import {
    Amount,
    Client,
    Context,
    ContractUtils,
    DepositSteps,
    GasPriceManager,
    LoyaltyType,
    MobileType,
    NonceManager,
    NormalSteps,
    WithdrawSteps
} from "../../src";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { AddressZero } from "@ethersproject/constants";
import { Network } from "../../src/client-common/interfaces/network";

import * as assert from "assert";
import { Wallet } from "@ethersproject/wallet";
import { IPurchaseData } from "../helper/types";
import * as fs from "fs";

interface IUserData {
    idx: number;
    phone: string;
    address: string;
    privateKey: string;
    loyaltyType: number;
}

export interface IShopData {
    shopId: string;
    name: string;
    address: string;
    privateKey: string;
}

describe("Ledger", () => {
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
    const linkValidatorWallets = [
        accounts[AccountIndex.LINK_VALIDATOR1],
        accounts[AccountIndex.LINK_VALIDATOR2],
        accounts[AccountIndex.LINK_VALIDATOR3]
    ];
    const users: IUserData[] = JSON.parse(fs.readFileSync("test/helper/users.json", "utf8"));
    const shops: IShopData[] = JSON.parse(fs.readFileSync("test/helper/shops.json", "utf8"));
    const userWallets = users.map(
        (m) => new NonceManager(new GasPriceManager(new Wallet(m.privateKey, contractInfo.provider)))
    );
    const shopWallets = shops.map(
        (m) => new NonceManager(new GasPriceManager(new Wallet(m.privateKey, contractInfo.provider)))
    );

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

    let client: Client;
    beforeAll(async () => {
        contextParams.signer = userWallets[0];
        const ctx = new Context(contextParams);
        client = new Client(ctx);
    });

    let signer: Signer;
    let userAddress: string;
    let phone: string;
    let phoneHash: string;
    beforeAll(async () => {
        client.useSigner(userWallets[0]);
        signer = client.web3.getConnectedSigner();
        userAddress = await signer.getAddress();
        phone = users[purchaseData[0].userIndex].phone;
        phoneHash = ContractUtils.getPhoneHash(phone);
    });

    it("Server Health Checking", async () => {
        const isUp = await client.ledger.isRelayUp();
        expect(isUp).toEqual(true);
    });

    it("Save Purchase Data 1", async () => {
        const purchaseAmount = Amount.make(purchaseData[0].amount, 18).value.mul(1000);
        const loyaltyAmount = purchaseAmount.mul(1).div(100);
        const purchaseParams = {
            purchaseId: NodeInfo.getPurchaseId(),
            amount: purchaseAmount,
            loyalty: loyaltyAmount,
            currency: purchaseData[0].currency.toLowerCase(),
            shopId: shops[purchaseData[0].shopIndex].shopId,
            account: AddressZero,
            phone: phoneHash,
            sender: await accounts[AccountIndex.FOUNDATION].getAddress()
        };
        const purchaseMessage = ContractUtils.getPurchasesMessage(0, [purchaseParams]);
        const signatures = validatorWallets.map((m) => ContractUtils.signMessage(m, purchaseMessage));
        await contractInfo.loyaltyProvider.connect(validatorWallets[4]).savePurchase(0, [purchaseParams], signatures);
    });

    it("Save Purchase Data 2", async () => {
        const purchaseAmount = Amount.make(purchaseData[0].amount, 18).value.mul(1000);
        const loyaltyAmount = purchaseAmount.mul(1).div(100);
        const purchaseParams = {
            purchaseId: NodeInfo.getPurchaseId(),
            amount: purchaseAmount,
            loyalty: loyaltyAmount,
            currency: purchaseData[0].currency.toLowerCase(),
            shopId: shops[purchaseData[0].shopIndex].shopId,
            account: userAddress,
            phone: phoneHash,
            sender: await accounts[AccountIndex.FOUNDATION].getAddress()
        };
        const purchaseMessage = ContractUtils.getPurchasesMessage(0, [purchaseParams]);
        const signatures = validatorWallets.map((m) => ContractUtils.signMessage(m, purchaseMessage));
        await contractInfo.loyaltyProvider.connect(validatorWallets[4]).savePurchase(0, [purchaseParams], signatures);
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
        const nonce = await contractInfo.phoneLinkCollection.nonceOf(userAddress);
        const signature = await ContractUtils.signRequestHash(signer, phoneHash, nonce);
        const requestId = ContractUtils.getRequestId(phoneHash, userAddress, nonce);
        //Add Phone
        await contractInfo.phoneLinkCollection.connect(signer).addRequest(requestId, phoneHash, userAddress, signature);
        // Vote
        await contractInfo.phoneLinkCollection.connect(linkValidatorWallets[0]).voteRequest(requestId);
        await contractInfo.phoneLinkCollection.connect(linkValidatorWallets[1]).voteRequest(requestId);
        await contractInfo.phoneLinkCollection.connect(linkValidatorWallets[0]).countVote(requestId);
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
        const feePoint = await client.currency.currencyToPoint(amount.value.mul(feeRate).div(10000), purchase.currency);

        // Open New
        let res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/new/open"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
            purchaseId: purchase.purchaseId,
            amount: amount.toString(),
            currency: purchase.currency.toLowerCase(),
            shopId: shops[purchase.shopIndex].shopId,
            account: await userWallets[0].getAddress()
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
                    expect(step.account).toEqual(await userWallets[0].getAddress());
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
        res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/new/close"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
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
        res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/cancel/open"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
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
                    expect(step.account).toEqual(await shopWallets[0].getAddress());
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(detail.purchaseId);
                    expect(step.approval).toEqual(true);
                    expect(step.account).toEqual(await shopWallets[0].getAddress());
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.APPROVED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(detail.purchaseId);
                    expect(step.approval).toEqual(true);
                    expect(step.account).toEqual(await shopWallets[0].getAddress());
                    break;
                default:
                    throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
            }
        }

        await ContractUtils.delay(1000);

        // Close Cancel
        res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/cancel/close"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
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
                    expect(step.account).toBe(await userWallets[0].getAddress());
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
        const feePoint = await client.currency.currencyToPoint(amount.value.mul(feeRate).div(10000), purchase.currency);

        const paidToken = await client.currency.pointToToken(paidPoint);
        const feeToken = await client.currency.pointToToken(feePoint);

        // Open New
        let res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/new/open"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
            purchaseId: purchase.purchaseId,
            amount: amount.toString(),
            currency: purchase.currency.toLowerCase(),
            shopId: shops[purchase.shopIndex].shopId,
            account: userWallets[0].getAddress()
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
                    expect(step.account).toEqual(await userWallets[0].getAddress);
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
        res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/new/close"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
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
        res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/cancel/open"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
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
                    expect(step.account).toEqual(await shopWallets[0].getAddress());
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(detail.purchaseId);
                    expect(step.approval).toEqual(true);
                    expect(step.account).toEqual(await shopWallets[0].getAddress());
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.APPROVED:
                    expect(step.paymentId).toEqual(paymentId);
                    expect(step.purchaseId).toEqual(detail.purchaseId);
                    expect(step.approval).toEqual(true);
                    expect(step.account).toEqual(await userWallets[0].getAddress());
                    break;
                default:
                    throw new Error("Unexpected pay point step: " + JSON.stringify(step, null, 2));
            }
        }

        await ContractUtils.delay(1000);

        // Close Cancel
        res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/cancel/close"), {
            accessKey: NodeInfo.RELAY_ACCESS_KEY,
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
        const beforeBalance = await contractInfo.ledger.tokenBalanceOf(userAddress);

        let tx = await contractInfo.token
            .connect(accounts[AccountIndex.OWNER])
            .transfer(await userWallets[0].getAddress(), amountToTrade.value);
        await tx.wait();

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

        const afterBalance = await contractInfo.ledger.tokenBalanceOf(userAddress);
        expect(afterBalance.toString()).toEqual(beforeBalance.add(amountToTrade.value).toString());
    });

    it("Test of the withdraw", async () => {
        const beforeBalance = await contractInfo.ledger.tokenBalanceOf(userAddress);

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

        const afterBalance = await contractInfo.ledger.tokenBalanceOf(userAddress);
        expect(afterBalance.toString()).toEqual(beforeBalance.sub(amountToTrade.value).toString());
    });

    it("Register Mobile Token", async () => {
        const token = "12345678901234567890123456789012345678901234567890";
        const language = "kr";
        const os = "iOS";
        await client.ledger.registerMobileToken(token, language, os, MobileType.USER_APP);
    });
});
