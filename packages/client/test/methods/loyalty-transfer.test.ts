import { AccountIndex, NodeInfo } from "../helper/NodeInfo";
import { Amount, Client, Context, NormalSteps } from "../../src";

import * as fs from "fs";
import { Wallet } from "@ethersproject/wallet";

interface IUserData {
    idx: number;
    phone: string;
    address: string;
    privateKey: string;
    loyaltyType: number;
}

describe("LoyaltyTransfer", () => {
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

    it("Test of the transfer", async () => {
        const chainInfo = await client.ledger.getChainInfoOfSideChain();
        const fee = chainInfo.network.transferFee;
        const amount = Amount.make(100, 18).value;
        const oldBalance0 = await client.ledger.getTokenBalance(users[0].address);
        const oldBalance1 = await client.ledger.getTokenBalance(users[1].address);
        client.useSigner(new Wallet(users[0].privateKey, NodeInfo.createProvider()));
        for await (const step of client.ledger.transfer(users[1].address, amount)) {
            switch (step.key) {
                case NormalSteps.PREPARED:
                    expect(step.from).toEqual(users[0].address);
                    expect(step.to).toEqual(users[1].address);
                    expect(step.amount).toEqual(amount);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                case NormalSteps.SENT:
                    expect(step.from).toEqual(users[0].address);
                    expect(step.to).toEqual(users[1].address);
                    expect(step.amount).toEqual(amount);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    expect(step.txHash).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    break;
                case NormalSteps.DONE:
                    expect(step.from).toEqual(users[0].address);
                    expect(step.to).toEqual(users[1].address);
                    expect(step.amount).toEqual(amount);
                    expect(step.signature).toMatch(/^0x[A-Fa-f0-9]{130}$/i);
                    break;
                default:
                    throw new Error("Unexpected transfer step: " + JSON.stringify(step, null, 2));
            }
        }
        const newBalance0 = await client.ledger.getTokenBalance(users[0].address);
        const newBalance1 = await client.ledger.getTokenBalance(users[1].address);
        expect(newBalance0).toEqual(oldBalance0.sub(amount).sub(fee));
        expect(newBalance1).toEqual(oldBalance1.add(amount));
    });
});
