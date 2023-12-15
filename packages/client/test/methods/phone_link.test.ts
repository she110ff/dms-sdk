import { Client, Context, ContractUtils, PhoneLinkRegisterSteps, PhoneLinkSubmitSteps } from "../../src";
import { Wallet } from "@ethersproject/wallet";
import { NodeInfo } from "../helper/NodeInfo";

describe("SDK Client", () => {
    const contextParams = NodeInfo.getContextParams();
    let client: Client;
    let user = Wallet.createRandom();
    beforeAll(async () => {
        contextParams.signer = user;
        const ctx = new Context(contextParams);
        client = new Client(ctx);
    });

    it("Web3 Health Checking", async () => {
        const isUp = await client.link.web3.isUp();
        expect(isUp).toEqual(true);
    });

    const userPhone = "01012349999";
    let requestId = "";
    it("register", async () => {
        for await (const step of client.link.register(userPhone)) {
            switch (step.key) {
                case PhoneLinkRegisterSteps.SENDING:
                    expect(step.requestId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    expect(step.phone).toEqual(userPhone);
                    expect(step.address).toEqual(await user.getAddress());
                    requestId = step.requestId.toString();
                    break;
                case PhoneLinkRegisterSteps.REQUESTED:
                    expect(step.requestId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                    expect(step.phone).toEqual(userPhone);
                    expect(step.address).toEqual(await user.getAddress());
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
        const address = await user.getAddress();
        await expect(await client.link.toAddress(phoneHash)).toEqual(address);
        await expect(await client.link.toPhoneNumber(address)).toEqual(phoneHash);
    });
});
