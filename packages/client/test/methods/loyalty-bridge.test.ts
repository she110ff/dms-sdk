import { AccountIndex, NodeInfo } from "../helper/NodeInfo";
import { Amount, Client, Context, ContractUtils, NormalSteps, WaiteBridgeSteps } from "../../src";

import * as fs from "fs";
import { Wallet } from "@ethersproject/wallet";

interface IUserData {
    idx: number;
    phone: string;
    address: string;
    privateKey: string;
    loyaltyType: number;
}

describe("LoyaltyBridge", () => {
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

    let client: Client;
    const users: IUserData[] = (JSON.parse(fs.readFileSync("test/helper/users.json", "utf8")) as IUserData[]).filter(
        (m) => m.loyaltyType === 1
    );
    beforeAll(async () => {
        contextParams.signer = new Wallet(users[0].privateKey);
        const ctx = new Context(contextParams);
        client = new Client(ctx);
    });

    beforeAll(async () => {
        client.useSigner(new Wallet(users[0].privateKey));
    });

    it("Server Health Checking", async () => {
        const isUp = await client.ledger.isRelayUp();
        expect(isUp).toEqual(true);
    });

    it("Set Exchange Rate", async () => {
        await NodeInfo.setExchangeRate(contractInfo.currencyRate, validatorWallets);
    });

    it("Test of the deposit via bridge", async () => {
        const userIdx = 2;
        const sideChainInfo = await client.ledger.getChainInfoOfSideChain();
        const fee = sideChainInfo.network.bridgeFee;
        const amount = Amount.make(100, 18).value;
        const oldBalanceMainChain = await client.ledger.getMainChainBalance(users[userIdx].address);
        const oldBalanceLedger = await client.ledger.getTokenBalance(users[userIdx].address);
        client.useSigner(new Wallet(users[userIdx].privateKey, NodeInfo.createProvider()));
        let depositId: string = "";
        for await (const step of client.ledger.depositViaBridge(amount)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.account).toEqual(users[userIdx].address);
                    expect(step.amount).toEqual(amount);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.account).toEqual(users[userIdx].address);
                    expect(step.amount).toEqual(amount);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    expect(step.tokenId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    expect(step.depositId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.DONE:
                    expect(step.account).toEqual(users[userIdx].address);
                    expect(step.amount).toEqual(amount);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    expect(step.tokenId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    expect(step.depositId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    depositId = step.depositId;
                    break;
                default:
                    throw new Error("Unexpected bridge step: " + JSON.stringify(step, null, 2));
            }
        }

        for await (const step of client.ledger.waiteDepositViaBridge(depositId, 30)) {
            switch (step.key) {
                case WaiteBridgeSteps.CREATED:
                    console.log("WaiteBridgeSteps.CREATED");
                    expect(step.account).toEqual(users[userIdx].address);
                    expect(step.amount).toEqual(amount);
                    expect(step.tokenId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case WaiteBridgeSteps.EXECUTED:
                    console.log("WaiteBridgeSteps.EXECUTED");
                    expect(step.account).toEqual(users[userIdx].address);
                    expect(step.amount).toEqual(amount);
                    expect(step.tokenId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case WaiteBridgeSteps.DONE:
                    console.log("WaiteBridgeSteps.DONE");
                    break;
                default:
                    throw new Error("Unexpected watch bridge step: " + JSON.stringify(step, null, 2));
            }
        }

        const newBalanceMainChain = await client.ledger.getMainChainBalance(users[userIdx].address);
        const newBalanceLedger = await client.ledger.getTokenBalance(users[userIdx].address);
        expect(newBalanceMainChain).toEqual(oldBalanceMainChain.sub(amount));
        expect(newBalanceLedger).toEqual(oldBalanceLedger.add(amount).sub(fee));
    });

    it("Waiting...", async () => {
        await ContractUtils.delay(5000);
    });

    it("Test of the withdraw via bridge", async () => {
        const userIdx = 5;
        const mainChainInfo = await client.ledger.getChainInfoOfMainChain();
        const fee = mainChainInfo.network.bridgeFee;
        const amount = Amount.make(100, 18).value;
        const oldBalanceMainChain = await client.ledger.getMainChainBalance(users[userIdx].address);
        const oldBalanceLedger = await client.ledger.getTokenBalance(users[userIdx].address);
        client.useSigner(new Wallet(users[userIdx].privateKey, NodeInfo.createProvider()));
        let depositId: string = "";
        for await (const step of client.ledger.withdrawViaBridge(amount)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.account).toEqual(users[userIdx].address);
                    expect(step.amount).toEqual(amount);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.account).toEqual(users[userIdx].address);
                    expect(step.amount).toEqual(amount);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    expect(step.tokenId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    expect(step.depositId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.DONE:
                    expect(step.account).toEqual(users[userIdx].address);
                    expect(step.amount).toEqual(amount);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    expect(step.tokenId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    expect(step.depositId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    depositId = step.depositId;
                    break;
                default:
                    throw new Error("Unexpected bridge step: " + JSON.stringify(step, null, 2));
            }
        }

        for await (const step of client.ledger.waiteWithdrawViaBridge(depositId, 60)) {
            switch (step.key) {
                case WaiteBridgeSteps.CREATED:
                    console.log("WaiteBridgeSteps.CREATED");
                    expect(step.account).toEqual(users[userIdx].address);
                    expect(step.amount).toEqual(amount);
                    expect(step.tokenId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case WaiteBridgeSteps.EXECUTED:
                    console.log("WaiteBridgeSteps.EXECUTED");
                    expect(step.account).toEqual(users[userIdx].address);
                    expect(step.amount).toEqual(amount);
                    expect(step.tokenId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case WaiteBridgeSteps.DONE:
                    console.log("WaiteBridgeSteps.DONE");
                    break;
                default:
                    throw new Error("Unexpected watch bridge step: " + JSON.stringify(step, null, 2));
            }
        }

        const newBalanceMainChain = await client.ledger.getMainChainBalance(users[userIdx].address);
        const newBalanceLedger = await client.ledger.getTokenBalance(users[userIdx].address);
        expect(newBalanceMainChain).toEqual(oldBalanceMainChain.add(amount).sub(fee));
        expect(newBalanceLedger).toEqual(oldBalanceLedger.sub(amount));
    });
});
