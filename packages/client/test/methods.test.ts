import { Server } from "ganache";
import * as ganacheSetup from "./helper/ganache-setup";
import * as deployContracts from "./helper/deployContracts";
import { getSigners, purchaseData } from "./helper/deployContracts";
import { contextParamsLocalChain } from "./helper/constants";
import { Client, Context, ContractUtils, LIVE_CONTRACTS, PayMileageParams } from "../src";
import { JsonRpcProvider, JsonRpcSigner } from "@ethersproject/providers";
import { restoreBlockTime } from "./helper/block-times";
import { BigNumber, Signer } from "ethers";
import { Wallet } from "@ethersproject/wallet";
import { TestRelayServer } from "./helper/Utils";

describe("Client", () => {
    let node: Server;
    let deployment: deployContracts.Deployment;
    let provider: JsonRpcProvider;
    let accounts: JsonRpcSigner[];
    let initAccount: any;
    let fakerServer: TestRelayServer;

    describe("Save Purchase Data & Pay (mileage, token)", () => {
        beforeAll(async () => {
            node = await ganacheSetup.start();

            if (Array.isArray(contextParamsLocalChain.web3Providers)) {
                provider = new JsonRpcProvider(contextParamsLocalChain.web3Providers[0] as string, {
                    name: "bosagora_devnet",
                    chainId: 24680
                });
            } else {
                provider = new JsonRpcProvider(contextParamsLocalChain.web3Providers as any);
            }

            deployment = await deployContracts.deployAll(provider);
            contextParamsLocalChain.token = deployment.token;
            contextParamsLocalChain.linkCollection = deployment.linkCollection;
            contextParamsLocalChain.validatorCollection = deployment.validatorCollection;
            contextParamsLocalChain.tokenPrice = deployment.tokenPrice;
            contextParamsLocalChain.franchiseeCollection = deployment.franchiseeCollection;
            contextParamsLocalChain.ledger = deployment.ledger;
            contextParamsLocalChain.web3Providers = deployment.provider;

            accounts = getSigners(provider);
            initAccount = node.provider.getInitialAccounts();
            await restoreBlockTime(provider);

            LIVE_CONTRACTS.bosagora_devnet.LinkCollection = deployment.linkCollection.address;
            LIVE_CONTRACTS.bosagora_devnet.Token = deployment.token.address;
            LIVE_CONTRACTS.bosagora_devnet.Ledger = deployment.ledger.address;
            LIVE_CONTRACTS.bosagora_devnet.FranchiseeCollection = deployment.franchiseeCollection.address;
            LIVE_CONTRACTS.bosagora_devnet.TokenPrice = deployment.tokenPrice.address;
            LIVE_CONTRACTS.bosagora_devnet.ValidatorCollection = deployment.validatorCollection.address;

            fakerServer = new TestRelayServer(7070, deployment);
            await fakerServer.start();
        });

        afterAll(async () => {
            await node.close();
            await fakerServer.stop();
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

            it("Server Health Checking", async () => {
                const isUp = await client.http.isUp();
                expect(isUp).toEqual(true);
            });

            it("Register user email", async () => {
                const validator1 = accounts[1];
                const validator2 = accounts[2];
                const user = await accounts[4].getAddress();
                const userWallet = new Wallet(initAccount[user.toLowerCase()].secretKey, provider);
                const userAddress = await userWallet.getAddress();
                const exampleData = purchaseData[0];
                const nonce = await deployment.linkCollection.nonceOf(userAddress);
                const emailHash = ContractUtils.sha256String(exampleData.userEmail);
                const signature = await ContractUtils.sign(userWallet, emailHash, nonce);
                //Add Email
                await deployment.linkCollection.connect(userWallet).addRequest(emailHash, userAddress, signature);
                // Vote
                await deployment.linkCollection.connect(validator1).voteRequest(0, 1);
                await deployment.linkCollection.connect(validator2).voteRequest(0, 1);
            });

            it("Test of Pay mileage", async () => {
                const userWallet = new Wallet(
                    initAccount[(await accounts[4].getAddress()).toLowerCase()].secretKey,
                    provider
                );
                const exampleData = purchaseData[0];

                const param: PayMileageParams = {
                    signer: userWallet as Signer,
                    purchaseId: exampleData.purchaseId,
                    purchaseAmount: exampleData.amount,
                    email: exampleData.userEmail,
                    franchiseeId: exampleData.franchiseeId
                };

                const option = await client.methods.getPayMileageOption(param);
                const responseData = await client.http.fetchPayMileage(option);

                expect(responseData).toEqual({ txHash: "0X1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" });
            });
            it("Test of Pay Token", async () => {
                const userWallet = new Wallet(
                    initAccount[(await accounts[4].getAddress()).toLowerCase()].secretKey,
                    provider
                );
                const exampleData = purchaseData[0];

                const param: PayMileageParams = {
                    signer: userWallet as Signer,
                    purchaseId: exampleData.purchaseId,
                    purchaseAmount: exampleData.amount,
                    email: exampleData.userEmail,
                    franchiseeId: exampleData.franchiseeId
                };

                const option = await client.methods.getPayTokenOption(param);
                const responseData = await client.http.fetchPayMileage(option);

                expect(responseData).toEqual({ txHash: "0X1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" });
            });
        });
    });
});
