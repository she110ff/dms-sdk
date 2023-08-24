import { Server } from "ganache";
import * as ganacheSetup from "./helper/ganache-setup";
import * as deployContracts from "./helper/deployContracts";
import { contextParamsLocalChain } from "./helper/constants";
import { Client, Context, LIVE_CONTRACTS } from "../src";
import { JsonRpcProvider } from "@ethersproject/providers";
import { restoreBlockTime } from "./helper/block-times";
import { BigNumber } from "ethers";

interface PurchaseData {
    purchaseId: string;
    timestamp: number;
    amount: number;
    userEmail: string;
    franchiseeId: string;
    method: number;
}

describe("Client", () => {
    let server: Server;
    let deployment: deployContracts.Deployment;
    let provider: JsonRpcProvider;

    describe("Save Purchase Data & Pay (mileage, token)", () => {
        beforeAll(async () => {
            server = await ganacheSetup.start();
            deployment = await deployContracts.deployAll();
            contextParamsLocalChain.token = deployment.token;
            contextParamsLocalChain.linkCollection = deployment.linkCollection;
            contextParamsLocalChain.validatorCollection = deployment.validatorCollection;
            contextParamsLocalChain.tokenPrice = deployment.tokenPrice;
            contextParamsLocalChain.franchiseeCollection = deployment.franchiseeCollection;
            contextParamsLocalChain.ledger = deployment.ledger;
            if (Array.isArray(contextParamsLocalChain.web3Providers)) {
                provider = new JsonRpcProvider(contextParamsLocalChain.web3Providers[0] as string);
            } else {
                provider = new JsonRpcProvider(contextParamsLocalChain.web3Providers as any);
            }
            await restoreBlockTime(provider);

            LIVE_CONTRACTS.bosagora_devnet.LinkCollection = deployment.linkCollection.address;
            LIVE_CONTRACTS.bosagora_devnet.Token = deployment.token.address;
            LIVE_CONTRACTS.bosagora_devnet.Ledger = deployment.ledger.address;
            LIVE_CONTRACTS.bosagora_devnet.FranchiseeCollection = deployment.franchiseeCollection.address;
            LIVE_CONTRACTS.bosagora_devnet.TokenPrice = deployment.tokenPrice.address;
            LIVE_CONTRACTS.bosagora_devnet.ValidatorCollection = deployment.validatorCollection.address;
        });

        afterAll(async () => {
            await server.close();
        });

        describe("Method Check", () => {
            let client: Client;
            it("Create local Client", async () => {
                const networkSpy = jest.spyOn(JsonRpcProvider, "getNetwork");
                networkSpy.mockReturnValueOnce({
                    name: "bosagora_devnet",
                    chainId: 24680
                });
                const ctx = new Context(contextParamsLocalChain);
                client = new Client(ctx);
            });

            it("Test getting the mileage balance", async () => {
                const purchase = purchaseData[0];
                const mileage = await client.methods.getMileageBalances({ email: purchase.userEmail });
                const amt = BigNumber.from(0);
                expect(mileage).toEqual(amt);
            });

            it("Test getting the token balance", async () => {
                const purchase = purchaseData[0];
                const mileage = await client.methods.getTokenBalances({ email: purchase.userEmail });
                const amt = BigNumber.from(0);
                expect(mileage).toEqual(amt);
            });
        });
    });
});

const purchaseData: PurchaseData[] = [
    {
        purchaseId: "P000001",
        timestamp: 1672844400,
        amount: 10000,
        userEmail: "a@example.com",
        franchiseeId: "F000100",
        method: 0
    },
    {
        purchaseId: "P000002",
        timestamp: 1675522800,
        amount: 10000,
        userEmail: "b@example.com",
        franchiseeId: "F000100",
        method: 0
    },
    {
        purchaseId: "P000003",
        timestamp: 1677942000,
        amount: 10000,
        userEmail: "c@example.com",
        franchiseeId: "F000200",
        method: 0
    },
    {
        purchaseId: "P000004",
        timestamp: 1680620400,
        amount: 10000,
        userEmail: "d@example.com",
        franchiseeId: "F000300",
        method: 0
    },
    {
        purchaseId: "P000005",
        timestamp: 1683212400,
        amount: 10000,
        userEmail: "a@example.com",
        franchiseeId: "F000200",
        method: 0
    }
];
