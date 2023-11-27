/*
import { contextParamsDevnet } from "../helper/constants";
import { Client, Context, ContractUtils, LedgerAction, LIVE_CONTRACTS } from "../../src";
import { Wallet } from "@ethersproject/wallet";

// @ts-ignore
import fs from "fs";

interface IUserData {
    idx: number;
    phone: string;
    address: string;
    privateKey: string;
    loyaltyType: number;
}

describe("Integrated test of Ledger", () => {
    describe("Method Check", () => {
        let client: Client;
        const users: IUserData[] = JSON.parse(fs.readFileSync("test/helper/users.json", "utf8"));
        beforeAll(async () => {
            contextParamsDevnet.tokenAddress = LIVE_CONTRACTS["bosagora_devnet"].TokenAddress;
            contextParamsDevnet.phoneLinkCollectionAddress =
                LIVE_CONTRACTS["bosagora_devnet"].PhoneLinkCollectionAddress;
            contextParamsDevnet.validatorCollectionAddress =
                LIVE_CONTRACTS["bosagora_devnet"].ValidatorCollectionAddress;
            contextParamsDevnet.currencyRateAddress = LIVE_CONTRACTS["bosagora_devnet"].CurrencyRateAddress;
            contextParamsDevnet.shopCollectionAddress = LIVE_CONTRACTS["bosagora_devnet"].ShopCollectionAddress;
            contextParamsDevnet.ledgerAddress = LIVE_CONTRACTS["bosagora_devnet"].LedgerAddress;
            contextParamsDevnet.signer = new Wallet(users[50].privateKey);
            const ctx = new Context(contextParamsDevnet);
            client = new Client(ctx);
        });

        it("Web3 Health Checking", async () => {
            const isUp = await client.ledger.web3.isUp();
            expect(isUp).toEqual(true);
        });

        it("Server Health Checking", async () => {
            const isUp = await client.ledger.isRelayUp();
            expect(isUp).toEqual(true);
        });

        describe("GraphQL TEST", () => {
            it("GraphQL Server Health Test", async () => {
                const web3IsUp = await client.web3.isUp();
                expect(web3IsUp).toEqual(true);
                await ContractUtils.delay(1000);
                const isUp: boolean = await client.graphql.isUp();
                await ContractUtils.delay(1000);
                expect(isUp).toEqual(true);
            });

            it("Get Save & Use History", async () => {
                for (const user of users) {
                    const res = await client.ledger.getSaveAndUseHistory(user.address);
                    const length = res.userTradeHistories.length;
                    if (length > 0) {
                        expect(res.userTradeHistories[length - 1].account.toUpperCase()).toEqual(
                            user.address.toUpperCase()
                        );
                        expect([LedgerAction.SAVED, LedgerAction.USED, LedgerAction.CHANGED]).toContain(
                            res.userTradeHistories[length - 1].action
                        );
                    }
                }
            });

            it("Get Deposit & Withdraw History", async () => {
                for (const user of users) {
                    const res = await client.ledger.getDepositAndWithdrawHistory(user.address);
                    const length = res.userTradeHistories.length;
                    if (length > 0) {
                        expect(res.userTradeHistories[length - 1].account.toUpperCase()).toEqual(
                            user.address.toUpperCase()
                        );
                        expect([LedgerAction.DEPOSITED, LedgerAction.WITHDRAWN]).toContain(
                            res.userTradeHistories[length - 1].action
                        );
                    }
                }
            });
        });
    });
});
*/

import { ContractUtils } from "../../src";

describe("Integrated test of Ledger", () => {
    describe("Method Check", () => {
        it("Wait", async () => {
            await ContractUtils.delay(1000);
        });
    });
});
