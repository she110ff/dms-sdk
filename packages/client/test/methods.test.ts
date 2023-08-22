import { Server } from "ganache";
import * as ganacheSetup from "./helper/ganache-setup";
import * as deployContracts from "./helper/deployContracts";

describe("Client", () => {
    let deployment: deployContracts.Deployment;

    describe("Methods Module tests", () => {
        let server: Server;

        beforeAll(async () => {
            console.log("BEFORE ALL : INIT ");
            server = await ganacheSetup.start();
            deployment = await deployContracts.deploy();
            console.log("deployment ", deployment);
            // contextParamsLocalChain.daoFactoryAddress = deployment.daoFactory.address;
            // const daoCreation = await deployContracts.createTokenVotingDAO(
            //     deployment,
            //     "test-tokenvoting-dao",
            //     VotingMode.STANDARD
            // );
            // daoAddress = daoCreation.daoAddr;
        });

        afterAll(async () => {
            await server.close();
        });

        describe("DAO Creation", () => {
            it("Check balance", async () => {});
        });
    });
});
