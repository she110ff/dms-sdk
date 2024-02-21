import { AccountIndex, NodeInfo } from "../helper/NodeInfo";
import { Amount, Client, Context, ContractUtils } from "../../src";

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
        for (let idx = 0; idx < users.length - 1; idx++) {
            console.log(`${users[idx].address} -> ${users[idx + 1].address}`);
            const amount = Amount.make(100, 18).value;
            const wallet = new Wallet(users[idx].privateKey, NodeInfo.createProvider());
            const nonce = await contractInfo.ledger.nonceOf(users[idx].address);
            const message = ContractUtils.getTransferMessage(
                users[idx].address,
                users[idx + 1].address,
                amount,
                nonce,
                NodeInfo.CHAIN_ID
            );
            const signature = ContractUtils.signMessage(wallet, message);
            await contractInfo.loyaltyTransfer
                .connect(wallet)
                .transferToken(users[idx].address, users[idx + 1].address, amount, signature);
        }
    });
});
