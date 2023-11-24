/*
import { contextParamsDevnet } from "../helper/constants";

import {
    Client,
    Context,
    ContractUtils,
    LIVE_CONTRACTS,
    PhoneLinkRegisterSteps,
    PhoneLinkSubmitSteps
} from "../../src";
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

describe("SDK Client", () => {
    describe("SDK Client", () => {
        let client: Client;
        const users: IUserData[] = JSON.parse(fs.readFileSync("test/helper/users.json", "utf8"));
        let user = new Wallet(users[50].privateKey);
        beforeAll(async () => {
            const network = "bosagora_devnet";
            contextParamsDevnet.tokenAddress = LIVE_CONTRACTS[network].TokenAddress;
            contextParamsDevnet.phoneLinkCollectionAddress = LIVE_CONTRACTS[network].PhoneLinkCollectionAddress;
            contextParamsDevnet.validatorCollectionAddress = LIVE_CONTRACTS[network].ValidatorCollectionAddress;
            contextParamsDevnet.currencyRateAddress = LIVE_CONTRACTS[network].CurrencyRateAddress;
            contextParamsDevnet.shopCollectionAddress = LIVE_CONTRACTS[network].ShopCollectionAddress;
            contextParamsDevnet.ledgerAddress = LIVE_CONTRACTS[network].LedgerAddress;
            contextParamsDevnet.signer = user;
            const ctx = new Context(contextParamsDevnet);
            client = new Client(ctx);
        });

        it("Web3 Health Checking", async () => {
            const isUp = await client.link.web3.isUp();
            expect(isUp).toEqual(true);
        });

        it("Server Health Checking", async () => {
            const isUp = await client.link.isRelayUp();
            expect(isUp).toEqual(true);
        });

        const userPhone = "01098351803";
        let requestId = "";
        it("register", async () => {
            for await (const step of client.link.register(userPhone)) {
                switch (step.key) {
                    case PhoneLinkRegisterSteps.SENDING:
                        expect(step.requestId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        expect(step.phone).toEqual(userPhone);
                        expect(step.address).toEqual(user.address);
                        requestId = step.requestId.toString();
                        break;
                    case PhoneLinkRegisterSteps.REQUESTED:
                        expect(step.requestId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        expect(step.phone).toEqual(userPhone);
                        expect(step.address).toEqual(user.address);
                        break;
                    default:
                        throw new Error("Unexpected step: " + JSON.stringify(step, null, 2));
                }
            }
        });

        it("submit", async () => {
            for await (const step of client.link.submit(requestId, "000102")) {
                switch (step.key) {
                    case PhoneLinkSubmitSteps.SENDING:
                        expect(step.requestId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        break;
                    case PhoneLinkSubmitSteps.ACCEPTED:
                        expect(step.requestId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        break;
                    default:
                        throw new Error("Unexpected step: " + JSON.stringify(step, null, 2));
                }
            }
        });

        it("Wait", async () => {
            await ContractUtils.delay(3000);
        });

        it("Check", async () => {
            const phoneHash = ContractUtils.getPhoneHash(userPhone);
            const address = user.address;
            await expect(await client.link.toAddress(phoneHash)).toEqual(address);
            await expect(await client.link.toPhoneNumber(address)).toEqual(phoneHash);
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
