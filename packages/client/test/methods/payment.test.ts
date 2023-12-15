import { Amount, Client, Context, ContractUtils, NormalSteps } from "../../src";
import { Wallet } from "@ethersproject/wallet";
import { Network } from "../../src/client-common/interfaces/network";

import * as assert from "assert";
// @ts-ignore
import fs from "fs";
import { NodeInfo } from "../helper/NodeInfo";

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
    currency: string;
    providePercent: number;
    address: string;
    privateKey: string;
}

describe("Ledger", () => {
    const contextParams = NodeInfo.getContextParams();
    let client: Client;
    const users: IUserData[] = JSON.parse(fs.readFileSync("test/helper/users_mobile.json", "utf8"));
    const shopData: IShopData[] = JSON.parse(fs.readFileSync("test/helper/shops.json", "utf8"));
    let user = new Wallet(users[5].privateKey);
    beforeAll(async () => {
        contextParams.signer = user;
        const ctx = new Context(contextParams);
        client = new Client(ctx);
    });

    it("Web3 Health Checking", async () => {
        const isUp = await client.link.web3.isUp();
        expect(isUp).toEqual(true);
    });

    it("Test for token's payment", async () => {
        for (let idx = 0; idx < 10; idx++) {
            const oldBalance = await client.ledger.getTokenBalance(user.address);
            const purchase = {
                purchaseId: "P000001",
                timestamp: 1672844400,
                amount: 100,
                method: 0,
                currency: "krw",
                shopIndex: 0,
                userIndex: 0
            };
            const amount = Amount.make(purchase.amount, 18);

            const feeRate = await client.ledger.getFeeRate();
            const paidPoint = await client.currency.currencyToPoint(amount.value, purchase.currency);
            const feePoint = await client.currency.currencyToPoint(
                amount.value.mul(feeRate).div(100),
                purchase.currency
            );

            const paidToken = await client.currency.pointToToken(paidPoint);
            const feeToken = await client.currency.pointToToken(feePoint);

            // Open New
            console.log("Open New");
            let res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/new/open"), {
                accessKey: NodeInfo.RELAY_ACCESS_KEY,
                purchaseId: purchase.purchaseId,
                amount: amount.toString(),
                currency: purchase.currency.toLowerCase(),
                shopId: shopData[purchase.shopIndex].shopId,
                account: user.address
            });
            if (res.code !== 0) {
                console.error(res.error.message);
                process.exit(res.code);
            }

            const paymentId = res.data.paymentId;
            console.log(paymentId);

            await ContractUtils.delay(1000);

            let detail = await client.ledger.getPaymentDetail(paymentId);

            // Approve New
            console.log("Approve New");
            client.useSigner(user);
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
                        console.log("NormalSteps.PREPARED");
                        expect(step.paymentId).toEqual(paymentId);
                        expect(step.purchaseId).toEqual(detail.purchaseId);
                        expect(step.amount).toEqual(amount.value);
                        expect(step.currency).toEqual(detail.currency.toLowerCase());
                        expect(step.shopId).toEqual(detail.shopId);
                        expect(step.account).toEqual(user.address);
                        expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                        break;
                    case NormalSteps.SENT:
                        console.log("NormalSteps.SENT");
                        expect(step.paymentId).toEqual(paymentId);
                        expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        break;
                    case NormalSteps.APPROVED:
                        console.log("NormalSteps.APPROVED");
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
            console.log("Close New");
            res = await Network.post(new URL(contextParams.relayEndpoint + "v1/payment/new/close"), {
                accessKey: NodeInfo.RELAY_ACCESS_KEY,
                confirm: true,
                paymentId
            });
            assert.deepStrictEqual(res.code, 0);

            await ContractUtils.delay(2000);

            assert.deepStrictEqual(
                await client.ledger.getTokenBalance(user.address),
                oldBalance.sub(paidToken).sub(feeToken)
            );
        }
    });
});
