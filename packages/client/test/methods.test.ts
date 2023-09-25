import { Server } from "ganache";
import { GanacheServer } from "./helper/GanacheServer";
import * as deployContracts from "./helper/deployContracts";
import { purchaseData } from "./helper/deployContracts";
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

describe("Client", () => {
    let node: Server;
    let deployment: deployContracts.Deployment;
    let fakerRelayServer: FakerRelayServer;
    const [, , validator1, validator2, , user1] = GanacheServer.accounts();

    beforeAll(async () => {
        node = await GanacheServer.start();
        const provider = GanacheServer.createTestProvider();
        GanacheServer.setTestProvider(provider);

        deployment = await deployContracts.deployAll(provider);
        contextParamsLocalChain.tokenAddress = deployment.token.address;
        contextParamsLocalChain.linkCollectionAddress = deployment.linkCollection.address;
        contextParamsLocalChain.validatorCollectionAddress = deployment.validatorCollection.address;
        contextParamsLocalChain.tokenPriceAddress = deployment.tokenPrice.address;
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
    let email: string;
    let emailHash: string;
    beforeAll(async () => {
        signer = client.web3.getConnectedSigner();
        userAddress = await signer.getAddress();
        email = purchaseData[0].userEmail;
        emailHash = ContractUtils.sha256String(email);
    });

    it("Server Health Checking", async () => {
        const isUp = await client.methods.isRelayUp();
        expect(isUp).toEqual(true);
    });

    it("Save Purchase Data", async () => {
        const purchaseAmount = Amount.make(purchaseData[0].amount, 18).value.mul(1000);
        await deployment.ledger
            .connect(validator1)
            .savePurchase(
                purchaseData[0].purchaseId,
                purchaseData[0].timestamp,
                purchaseAmount,
                emailHash,
                purchaseData[0].shopId,
                purchaseData[0].method
            );
    });

    it("Link email-address", async () => {
        const nonce = await deployment.linkCollection.nonceOf(userAddress);
        const signature = await ContractUtils.sign(signer, emailHash, nonce);
        const requestId = ContractUtils.getRequestId(emailHash, userAddress, nonce);
        //Add Email
        await deployment.linkCollection.connect(signer).addRequest(requestId, emailHash, userAddress, signature);
        // Vote
        await deployment.linkCollection.connect(validator1).voteRequest(requestId);
        await deployment.linkCollection.connect(validator2).voteRequest(requestId);
        await deployment.linkCollection.connect(validator1).countVote(requestId);
    });

    it("Save Purchase Data 2", async () => {
        const purchaseAmount = Amount.make(purchaseData[0].amount, 18).value.mul(1000);
        await deployment.ledger
            .connect(validator1)
            .savePurchase(
                purchaseData[0].purchaseId,
                purchaseData[0].timestamp,
                purchaseAmount,
                emailHash,
                purchaseData[0].shopId,
                purchaseData[0].method
            );
    });

    const purchaseAmount = Amount.make(purchaseData[0].amount, 18).value.mul(1000);
    const pointAmount = purchaseAmount.div(100);
    const multiple = BigNumber.from(1000000000);
    const price = BigNumber.from(150).mul(multiple);
    const tokenAmount = pointAmount.mul(multiple).div(price);

    it("Balance Check - Test getting the point balance", async () => {
        const balance = await client.methods.getPointBalances(email);
        expect(balance).toEqual(pointAmount);
    });

    it("Balance Check - Test getting the token balance", async () => {
        const balance = await client.methods.getTokenBalances(email);
        expect(balance).toEqual(tokenAmount);
    });

    it("Test of pay point", async () => {
        const exampleData = purchaseData[0];
        const amount = Amount.make(exampleData.amount / 10, 18);
        const option = await client.methods.getPayPointOption(
            exampleData.purchaseId,
            amount.value,
            exampleData.userEmail,
            exampleData.shopId
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
        const exampleData = purchaseData[0];
        const amount = Amount.make(exampleData.amount, 18);
        const option = await client.methods.getPayTokenOption(
            exampleData.purchaseId,
            amount.value,
            exampleData.userEmail,
            exampleData.shopId
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
        const beforeBalance = await deployment.ledger.tokenBalanceOf(emailHash);

        for await (const step of client.methods.deposit(email, amountToTrade.value)) {
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

        const afterBalance = await deployment.ledger.tokenBalanceOf(emailHash);
        expect(afterBalance.toString()).toEqual(beforeBalance.add(amountToTrade.value).toString());
    });

    it("Test of the withdraw", async () => {
        const beforeBalance = await deployment.ledger.tokenBalanceOf(emailHash);

        for await (const step of client.methods.withdraw(email, amountToTrade.value)) {
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

        const afterBalance = await deployment.ledger.tokenBalanceOf(emailHash);
        expect(afterBalance.toString()).toEqual(beforeBalance.sub(amountToTrade.value).toString());
    });
});
