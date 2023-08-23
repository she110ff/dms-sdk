import { Server } from "ganache";
import * as ganacheSetup from "./helper/ganache-setup";
import * as deployContracts from "./helper/deployContracts";
import { contextParamsLocalChain } from "./helper/constants";

describe("Client", () => {
    let deployment: deployContracts.Deployment;

    describe("Methods Module tests", () => {
        let server: Server;

        beforeAll(async () => {
            server = await ganacheSetup.start();
            deployment = await deployContracts.deployAll();
            contextParamsLocalChain.tokenAddress = deployment.token;
            contextParamsLocalChain.linkCollectionAddress = deployment.linkCollection;
            contextParamsLocalChain.validatorCollectionAddress = deployment.validatorCollection;
            contextParamsLocalChain.tokenPriceAddress = deployment.tokenPrice;
            contextParamsLocalChain.franchiseeCollectionAddress = deployment.franchiseeCollection;
            contextParamsLocalChain.ledgerAddress = deployment.ledger;
        });

        afterAll(async () => {
            await server.close();
        });

        describe("Method Check", () => {
            it("Check balance", async () => {});
        });
    });
});
