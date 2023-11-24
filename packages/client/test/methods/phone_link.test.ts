import { Server } from "ganache";
import { GanacheServer } from "../helper/GanacheServer";
import { contextParamsLocalChain } from "../helper/constants";
import { FakerValidator } from "../helper/FakerValidator";
import { Client, Context, ContractUtils, PhoneLinkRegisterSteps, PhoneLinkSubmitSteps } from "../../src";
import { ContractDeployer, Deployment } from "../helper/ContractDeployer";

describe("SDK Client", () => {
    let deployment: Deployment;
    const [, , , , , , , , , , , user1] = GanacheServer.accounts();
    let fakerValidator: FakerValidator;

    describe("SDK Client", () => {
        let server: Server;

        beforeAll(async () => {
            server = await GanacheServer.start();

            deployment = await ContractDeployer.deploy();

            GanacheServer.setTestWeb3Signer(user1);

            console.log("Start Faker Validator");
            fakerValidator = new FakerValidator(7080, deployment);
            await fakerValidator.start();
        });

        afterAll(async () => {
            await server.close();
            await fakerValidator.stop();
        });

        let client: Client;
        beforeAll(async () => {
            const ctx = new Context(contextParamsLocalChain);
            client = new Client(ctx);
        });

        it("Server Health Checking", async () => {
            const isUp = await client.link.isRelayUp();
            expect(isUp).toEqual(true);
        });

        const userPhone = "01012341000";
        let requestId = "";
        it("register", async () => {
            for await (const step of client.link.register(userPhone)) {
                switch (step.key) {
                    case PhoneLinkRegisterSteps.SENDING:
                        expect(step.requestId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        expect(step.phone).toEqual(userPhone);
                        expect(step.address).toEqual(await user1.getAddress());
                        requestId = step.requestId.toString();
                        break;
                    case PhoneLinkRegisterSteps.REQUESTED:
                        expect(step.requestId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        expect(step.phone).toEqual(userPhone);
                        expect(step.address).toEqual(await user1.getAddress());
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
            const address = await user1.getAddress();
            await expect(await client.link.toAddress(phoneHash)).toEqual(address);
            await expect(await client.link.toPhoneNumber(address)).toEqual(phoneHash);
        });
    });
});
