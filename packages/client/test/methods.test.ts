import { Server } from "ganache";
import { GanacheServer } from "./helper/GanacheServer";
import * as deployContracts from "./helper/deployContracts";
import { purchaseData } from "./helper/deployContracts";
import { contextParamsLocalChain } from "./helper/constants";
import { Amount, Client, Context, ContractUtils } from "../src";
import { BigNumber } from "ethers";
import { TestRelayServer } from "./helper/Utils";

describe("Client", () => {
    let node: Server;
    let deployment: deployContracts.Deployment;
    let fakerServer: TestRelayServer;
    const [, , validator1, validator2, , user1] = GanacheServer.accounts();

    describe("Save Purchase Data & Pay (mileage, token)", () => {
        beforeAll(async () => {
            node = await GanacheServer.start();
            const provider = GanacheServer.createTestProvider();
            GanacheServer.setTestProvider(provider);

            deployment = await deployContracts.deployAll(provider);
            contextParamsLocalChain.tokenAddress = deployment.token.address;
            contextParamsLocalChain.linkCollectionAddress = deployment.linkCollection.address;
            contextParamsLocalChain.validatorCollectionAddress = deployment.validatorCollection.address;
            contextParamsLocalChain.tokenPriceAddress = deployment.tokenPrice.address;
            contextParamsLocalChain.franchiseeCollectionAddress = deployment.franchiseeCollection.address;
            contextParamsLocalChain.ledgerAddress = deployment.ledger.address;
            contextParamsLocalChain.web3Providers = deployment.provider;

            GanacheServer.setTestWeb3Signer(user1);

            fakerServer = new TestRelayServer(7070, deployment);
            await fakerServer.start();
        });

        afterAll(async () => {
            await node.close();
            await fakerServer.stop();
        });

        describe("Method Check", () => {
            let client: Client;
            beforeAll(async () => {
                const ctx = new Context(contextParamsLocalChain);
                client = new Client(ctx);
            });

            it("Server Health Checking", async () => {
                const isUp = await client.methods.isRelayUp();
                expect(isUp).toEqual(true);
            });

            describe("Balance Check", () => {
                it("Test getting the mileage balance", async () => {
                    const purchase = purchaseData[0];
                    const mileage = await client.methods.getMileageBalances(purchase.userEmail);
                    const amt = BigNumber.from(0);
                    expect(mileage).toEqual(amt);
                });

                it("Test getting the token balance", async () => {
                    const purchase = purchaseData[0];
                    const mileage = await client.methods.getTokenBalances(purchase.userEmail);
                    const amt = BigNumber.from(0);
                    expect(mileage).toEqual(amt);
                });
            });

            describe("Pay Check", () => {
                beforeAll(async () => {
                    const signer = client.web3.getConnectedSigner();
                    const userAddress = await signer.getAddress();
                    const exampleData = purchaseData[0];
                    const nonce = await deployment.linkCollection.nonceOf(userAddress);
                    const emailHash = ContractUtils.sha256String(exampleData.userEmail);
                    const signature = await ContractUtils.sign(signer, emailHash, nonce);
                    const requestId = ContractUtils.getRequestId(emailHash, userAddress, nonce);
                    //Add Email
                    await deployment.linkCollection
                        .connect(signer)
                        .addRequest(requestId, emailHash, userAddress, signature);
                    // Vote
                    await deployment.linkCollection.connect(validator1).voteRequest(requestId, 1);
                    await deployment.linkCollection.connect(validator2).voteRequest(requestId, 1);
                    await deployment.linkCollection.connect(validator1).countVote(requestId);
                });

                it("Test of pay mileage", async () => {
                    const exampleData = purchaseData[0];
                    const option = await client.methods.getPayMileageOption(
                        exampleData.purchaseId,
                        Amount.make(exampleData.amount, 18).value,
                        exampleData.userEmail,
                        exampleData.franchiseeId
                    );
                    const responseData = await client.methods.fetchPayMileage(option);

                    expect(responseData).toEqual({ txHash: "0X1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" });
                });

                it("Test of pay token", async () => {
                    const exampleData = purchaseData[0];
                    const option = await client.methods.getPayTokenOption(
                        exampleData.purchaseId,
                        Amount.make(exampleData.amount, 18).value,
                        exampleData.userEmail,
                        exampleData.franchiseeId
                    );
                    const responseData = await client.methods.fetchPayToken(option);

                    expect(responseData).toEqual({ txHash: "0X1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" });
                });
            });

            describe("Exchange Check", () => {
                const amountDepositToken = Amount.make(10_000, 18);
                beforeAll(async () => {
                    const signer = client.web3.getConnectedSigner();
                    await deployment.token.connect(signer).approve(deployment.ledger.address, amountDepositToken.value);
                    await deployment.ledger.connect(signer).deposit(amountDepositToken.value);
                });

                it("Test of token to mileage exchange", async () => {
                    const exampleData = purchaseData[0];
                    const option = await client.methods.getTokenToMileageOption(
                        exampleData.userEmail,
                        amountDepositToken.value
                    );
                    const responseData = await client.methods.fetchExchangeTokenToMileage(option);
                    expect(responseData).toEqual({ txHash: "0X1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" });
                });

                it("Test of mileage to token exchange", async () => {
                    const exampleData = purchaseData[0];
                    const option = await client.methods.getMileageToTokenOption(
                        exampleData.userEmail,
                        amountDepositToken.value
                    );
                    const responseData = await client.methods.fetchExchangeMileageToToken(option);
                    expect(responseData).toEqual({ txHash: "0X1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" });
                });
            });

            describe("Deposit & withdraw", () => {
                const tradeAmount = 10_000;
                const amountToTrade = Amount.make(tradeAmount, 18);

                it("Test of the deposit", async () => {
                    const email = purchaseData[0].userEmail;
                    const emailHash = ContractUtils.sha256String(email);
                    const beforeBalance = await deployment.ledger.tokenBalanceOf(emailHash);
                    await client.methods.deposit(email, amountToTrade.value);
                    const afterBalance = await deployment.ledger.tokenBalanceOf(emailHash);
                    expect(afterBalance.toString()).toEqual(beforeBalance.add(amountToTrade.value).toString());
                });
                it("Test of the withdraw", async () => {
                    const email = purchaseData[0].userEmail;
                    const emailHash = ContractUtils.sha256String(email);
                    const beforeBalance = await deployment.ledger.tokenBalanceOf(emailHash);
                    await client.methods.withdraw(email, amountToTrade.value);
                    const afterBalance = await deployment.ledger.tokenBalanceOf(emailHash);
                    expect(afterBalance.toString()).toEqual(beforeBalance.sub(amountToTrade.value).toString());
                });
            });
        });
    });
});
