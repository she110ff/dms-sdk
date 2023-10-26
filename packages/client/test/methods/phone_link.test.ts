import { Server } from "ganache";
import { GanacheServer } from "../helper/GanacheServer";
import { contextParamsLocalChain } from "../helper/constants";
import { FakerValidator } from "../helper/FakerValidator";
import { Client, Context, ContractUtils, PhoneLinkRegisterSteps } from "../../src";
import * as deployContracts from "../helper/deployContracts";

describe("SDK Client", () => {
    let deployment: deployContracts.Deployment;
    const [, , , , , , , user1] = GanacheServer.accounts();
    let fakerValidator: FakerValidator;

    describe("SDK Client", () => {
        let server: Server;

        beforeAll(async () => {
            server = await GanacheServer.start();
            const provider = GanacheServer.createTestProvider();
            GanacheServer.setTestProvider(provider);

            deployment = await deployContracts.deployAll(provider);
            contextParamsLocalChain.tokenAddress = deployment.token.address;
            contextParamsLocalChain.phoneLinkCollectionAddress = deployment.phoneLinkCollection.address;
            contextParamsLocalChain.validatorCollectionAddress = deployment.validatorCollection.address;
            contextParamsLocalChain.currencyRateAddress = deployment.currencyRate.address;
            contextParamsLocalChain.shopCollectionAddress = deployment.shopCollection.address;
            contextParamsLocalChain.ledgerAddress = deployment.ledger.address;
            contextParamsLocalChain.web3Providers = deployment.provider;

            GanacheServer.setTestWeb3Signer(user1);

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
        it("register", async () => {
            for await (const step of client.link.register(userPhone)) {
                switch (step.key) {
                    case PhoneLinkRegisterSteps.SENDING:
                        expect(step.requestId).toMatch(/^0x[A-Fa-f0-9]{64}$/i);
                        expect(step.phone).toEqual(userPhone);
                        expect(step.address).toEqual(await user1.getAddress());
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
