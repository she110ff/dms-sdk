import * as dotenv from "dotenv";
import { JsonRpcProvider, Networkish } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";
import { Amount, ContractUtils, LIVE_CONTRACTS } from "../../src";
import {
    CurrencyRate,
    CurrencyRate__factory,
    Ledger,
    Ledger__factory,
    LoyaltyConsumer,
    LoyaltyConsumer__factory,
    LoyaltyExchanger,
    LoyaltyExchanger__factory,
    LoyaltyProvider,
    LoyaltyProvider__factory,
    Shop,
    Shop__factory,
    Token,
    Token__factory,
    Validator,
    Validator__factory
} from "dms-osx-lib";
import { PhoneLinkCollection, PhoneLinkCollection__factory } from "del-osx-lib";
import { ContractShopStatus, IShopData } from "./types";
import { Signer } from "@ethersproject/abstract-signer";
import { NonceManager } from "@ethersproject/experimental";

dotenv.config({ path: "env/.env" });

export enum AccountIndex {
    DEPLOYER,
    OWNER,
    FOUNDATION,
    SETTLEMENT,
    FEE,
    CERTIFIER,
    CERTIFIER01,
    CERTIFIER02,
    CERTIFIER03,
    VALIDATOR1,
    VALIDATOR2,
    VALIDATOR3,
    VALIDATOR4,
    VALIDATOR5,
    LINK_VALIDATOR1,
    LINK_VALIDATOR2,
    LINK_VALIDATOR3
}

export interface IContextParams {
    network: Networkish;
    signer: Signer;
    phoneLinkAddress: string;
    tokenAddress: string;
    validatorAddress: string;
    currencyRateAddress: string;
    shopAddress: string;
    ledgerAddress: string;
    loyaltyProviderAddress: string;
    loyaltyConsumerAddress: string;
    loyaltyExchangerAddress: string;
    web3Providers: string | JsonRpcProvider | (string | JsonRpcProvider)[];
    relayEndpoint: string | URL;
    graphqlNodes: { url: string }[];
}

export interface IContractInfo {
    provider: JsonRpcProvider;
    phoneLinkCollection: PhoneLinkCollection;
    token: Token;
    validator: Validator;
    currencyRate: CurrencyRate;
    shop: Shop;
    ledger: Ledger;
    loyaltyProvider: LoyaltyProvider;
    loyaltyConsumer: LoyaltyConsumer;
    loyaltyExchanger: LoyaltyExchanger;
}
export class NodeInfo {
    public static initialAccounts: any[];
    public static RELAY_ACCESS_KEY = process.env.RELAY_ACCESS_KEY || "";
    public static NODE_END_POINT = process.env.NODE_END_POINT_FOR_TEST || "";
    public static GRAPHQL_END_POINT = process.env.GRAPHQL_END_POINT_FOR_TEST || "";
    public static RELAY_END_POINT = process.env.RELAY_END_POINT_FOR_TEST || "";

    public static CHAIN_ID = 24680;

    public static CreateInitialAccounts(): any[] {
        const accounts: string[] = [];
        const reg_bytes64: RegExp = /^(0x)[0-9a-f]{64}$/i;

        // 0
        if (
            process.env.DEPLOYER !== undefined &&
            process.env.DEPLOYER.trim() !== "" &&
            reg_bytes64.test(process.env.DEPLOYER)
        ) {
            accounts.push(process.env.DEPLOYER);
        } else {
            process.env.DEPLOYER = Wallet.createRandom().privateKey;
            accounts.push(process.env.DEPLOYER);
        }

        // 1
        if (process.env.OWNER !== undefined && process.env.OWNER.trim() !== "" && reg_bytes64.test(process.env.OWNER)) {
            accounts.push(process.env.OWNER);
        } else {
            process.env.OWNER = Wallet.createRandom().privateKey;
            accounts.push(process.env.OWNER);
        }

        // 2
        if (
            process.env.FOUNDATION !== undefined &&
            process.env.FOUNDATION.trim() !== "" &&
            reg_bytes64.test(process.env.FOUNDATION)
        ) {
            accounts.push(process.env.FOUNDATION);
        } else {
            process.env.FOUNDATION = Wallet.createRandom().privateKey;
            accounts.push(process.env.FOUNDATION);
        }

        // 3
        if (
            process.env.SETTLEMENT !== undefined &&
            process.env.SETTLEMENT.trim() !== "" &&
            reg_bytes64.test(process.env.SETTLEMENT)
        ) {
            accounts.push(process.env.SETTLEMENT);
        } else {
            process.env.SETTLEMENT = Wallet.createRandom().privateKey;
            accounts.push(process.env.SETTLEMENT);
        }

        // 4
        if (process.env.FEE !== undefined && process.env.FEE.trim() !== "" && reg_bytes64.test(process.env.FEE)) {
            accounts.push(process.env.FEE);
        } else {
            process.env.FEE = Wallet.createRandom().privateKey;
            accounts.push(process.env.FEE);
        }

        // 5
        if (
            process.env.CERTIFIER !== undefined &&
            process.env.CERTIFIER.trim() !== "" &&
            reg_bytes64.test(process.env.CERTIFIER)
        ) {
            accounts.push(process.env.CERTIFIER);
        } else {
            process.env.CERTIFIER = Wallet.createRandom().privateKey;
            accounts.push(process.env.CERTIFIER);
        }

        // 6
        if (
            process.env.CERTIFIER01 !== undefined &&
            process.env.CERTIFIER01.trim() !== "" &&
            reg_bytes64.test(process.env.CERTIFIER01)
        ) {
            accounts.push(process.env.CERTIFIER01);
        } else {
            process.env.CERTIFIER01 = Wallet.createRandom().privateKey;
            accounts.push(process.env.CERTIFIER01);
        }

        // 7
        if (
            process.env.CERTIFIER02 !== undefined &&
            process.env.CERTIFIER02.trim() !== "" &&
            reg_bytes64.test(process.env.CERTIFIER02)
        ) {
            accounts.push(process.env.CERTIFIER02);
        } else {
            process.env.CERTIFIER02 = Wallet.createRandom().privateKey;
            accounts.push(process.env.CERTIFIER02);
        }

        // 8
        if (
            process.env.CERTIFIER03 !== undefined &&
            process.env.CERTIFIER03.trim() !== "" &&
            reg_bytes64.test(process.env.CERTIFIER03)
        ) {
            accounts.push(process.env.CERTIFIER03);
        } else {
            process.env.CERTIFIER03 = Wallet.createRandom().privateKey;
            accounts.push(process.env.CERTIFIER03);
        }

        // 9
        if (
            process.env.VALIDATOR1 !== undefined &&
            process.env.VALIDATOR1.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR1)
        ) {
            accounts.push(process.env.VALIDATOR1);
        } else {
            process.env.VALIDATOR1 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR1);
        }

        // 10
        if (
            process.env.VALIDATOR2 !== undefined &&
            process.env.VALIDATOR2.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR2)
        ) {
            accounts.push(process.env.VALIDATOR2);
        } else {
            process.env.VALIDATOR2 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR2);
        }

        // 11
        if (
            process.env.VALIDATOR3 !== undefined &&
            process.env.VALIDATOR3.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR3)
        ) {
            accounts.push(process.env.VALIDATOR3);
        } else {
            process.env.VALIDATOR3 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR3);
        }

        // 12
        if (
            process.env.VALIDATOR4 !== undefined &&
            process.env.VALIDATOR4.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR4)
        ) {
            accounts.push(process.env.VALIDATOR4);
        } else {
            process.env.VALIDATOR4 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR4);
        }

        // 13
        if (
            process.env.VALIDATOR5 !== undefined &&
            process.env.VALIDATOR5.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR5)
        ) {
            accounts.push(process.env.VALIDATOR5);
        } else {
            process.env.VALIDATOR5 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR5);
        }

        // 15
        if (
            process.env.LINK_VALIDATOR1 !== undefined &&
            process.env.LINK_VALIDATOR1.trim() !== "" &&
            reg_bytes64.test(process.env.LINK_VALIDATOR1)
        ) {
            accounts.push(process.env.LINK_VALIDATOR1);
        } else {
            process.env.LINK_VALIDATOR1 = Wallet.createRandom().privateKey;
            accounts.push(process.env.LINK_VALIDATOR1);
        }

        // 15
        if (
            process.env.LINK_VALIDATOR2 !== undefined &&
            process.env.LINK_VALIDATOR2.trim() !== "" &&
            reg_bytes64.test(process.env.LINK_VALIDATOR2)
        ) {
            accounts.push(process.env.LINK_VALIDATOR2);
        } else {
            process.env.LINK_VALIDATOR2 = Wallet.createRandom().privateKey;
            accounts.push(process.env.LINK_VALIDATOR2);
        }

        // 16
        if (
            process.env.LINK_VALIDATOR3 !== undefined &&
            process.env.LINK_VALIDATOR3.trim() !== "" &&
            reg_bytes64.test(process.env.LINK_VALIDATOR3)
        ) {
            accounts.push(process.env.LINK_VALIDATOR3);
        } else {
            process.env.LINK_VALIDATOR3 = Wallet.createRandom().privateKey;
            accounts.push(process.env.LINK_VALIDATOR3);
        }

        return accounts.map((m) => {
            return {
                balance: "0x100000000000000000000",
                secretKey: m
            };
        });
    }

    public static accounts(): Signer[] {
        if (NodeInfo.initialAccounts === undefined) {
            NodeInfo.initialAccounts = NodeInfo.CreateInitialAccounts();
        }
        return NodeInfo.initialAccounts.map(
            (m) => new NonceManager(new Wallet(m.secretKey).connect(NodeInfo.createProvider()))
        );
    }

    public static createProvider(): JsonRpcProvider {
        return new JsonRpcProvider(NodeInfo.NODE_END_POINT, NodeInfo.CHAIN_ID);
    }

    public static getContextParams(): IContextParams {
        const accounts = NodeInfo.accounts();
        const network = "bosagora_devnet";
        const contexts: IContextParams = {
            network: 24680,
            signer: accounts[0],
            tokenAddress: LIVE_CONTRACTS[network].TokenAddress,
            phoneLinkAddress: LIVE_CONTRACTS[network].PhoneLinkCollectionAddress,
            validatorAddress: LIVE_CONTRACTS[network].ValidatorAddress,
            currencyRateAddress: LIVE_CONTRACTS[network].CurrencyRateAddress,
            shopAddress: LIVE_CONTRACTS[network].ShopAddress,
            ledgerAddress: LIVE_CONTRACTS[network].LedgerAddress,
            loyaltyProviderAddress: LIVE_CONTRACTS[network].LoyaltyProviderAddress,
            loyaltyConsumerAddress: LIVE_CONTRACTS[network].LoyaltyConsumerAddress,
            loyaltyExchangerAddress: LIVE_CONTRACTS[network].LoyaltyExchangerAddress,
            relayEndpoint: NodeInfo.RELAY_END_POINT,
            web3Providers: NodeInfo.createProvider(),
            graphqlNodes: [
                {
                    url: NodeInfo.GRAPHQL_END_POINT
                }
            ]
        };

        return contexts;
    }

    public static getContractInfo(): IContractInfo {
        const provider = NodeInfo.createProvider();
        const contextParams = NodeInfo.getContextParams();

        console.log("Start Attach");

        console.log("Attach Token");
        const tokenContract = Token__factory.connect(contextParams.tokenAddress, provider);

        console.log("Attach Validator");
        const validatorContract: Validator = Validator__factory.connect(contextParams.validatorAddress, provider);

        console.log("Deposit Validator's Amount");
        const linkContract: PhoneLinkCollection = PhoneLinkCollection__factory.connect(
            contextParams.phoneLinkAddress,
            provider
        );

        console.log("Attach CurrencyRate");
        const currencyRateContract: CurrencyRate = CurrencyRate__factory.connect(
            contextParams.currencyRateAddress,
            provider
        );

        console.log("Attach Shop");
        const shopContract: Shop = Shop__factory.connect(contextParams.shopAddress, provider);

        console.log("Attach Ledger");
        const ledgerContract: Ledger = Ledger__factory.connect(contextParams.ledgerAddress, provider);

        console.log("Attach LoyaltyProvider");
        const providerContract: LoyaltyProvider = LoyaltyProvider__factory.connect(
            contextParams.loyaltyProviderAddress,
            provider
        );

        console.log("Attach LoyaltyConsumer");
        const consumerContract: LoyaltyConsumer = LoyaltyConsumer__factory.connect(
            contextParams.loyaltyConsumerAddress,
            provider
        );
        console.log("Attach LoyaltyExchanger");
        const exchangerContract: LoyaltyExchanger = LoyaltyExchanger__factory.connect(
            contextParams.loyaltyExchangerAddress,
            provider
        );

        console.log("Complete Attach");
        return {
            provider: provider,
            phoneLinkCollection: linkContract,
            token: tokenContract,
            validator: validatorContract,
            currencyRate: currencyRateContract,
            shop: shopContract,
            ledger: ledgerContract,
            loyaltyProvider: providerContract,
            loyaltyConsumer: consumerContract,
            loyaltyExchanger: exchangerContract
        };
    }

    public static async transferBOA(addresses: string[]) {
        console.log("Transfer BOA");
        const sender = NodeInfo.accounts()[AccountIndex.DEPLOYER];
        for (const account of addresses) {
            await sender.sendTransaction({
                to: account,
                value: Amount.make(100, 18).value
            });
        }
    }

    public static async transferToken(contracts: IContractInfo, addresses: string[]) {
        console.log("Transfer token");
        const sender = NodeInfo.accounts()[AccountIndex.OWNER];
        for (const account of addresses) {
            await contracts.token.connect(sender).transfer(account, Amount.make(100000, 18).value);
        }
    }

    public static async addShopData(contracts: IContractInfo, shopData: IShopData[]) {
        console.log("Add Shop Data");
        const sender = NodeInfo.accounts()[AccountIndex.CERTIFIER];
        for (const shop of shopData) {
            const nonce = await contracts.shop.nonceOf(shop.wallet.address);
            const signature = await ContractUtils.signShop(new Wallet(shop.wallet.privateKey), shop.shopId, nonce);
            await (
                await contracts.shop
                    .connect(sender)
                    .add(shop.shopId, shop.name, shop.currency, shop.wallet.address, signature)
            ).wait();
        }

        console.log("Update Shop");
        for (const shop of shopData) {
            const signature1 = ContractUtils.signShop(
                new Wallet(shop.wallet.privateKey),
                shop.shopId,
                await contracts.shop.nonceOf(shop.wallet.address)
            );
            await (
                await contracts.shop
                    .connect(sender)
                    .update(shop.shopId, shop.name, shop.currency, shop.providePercent, shop.wallet.address, signature1)
            ).wait();
        }

        console.log("Change Status of Shop");
        for (const shop of shopData) {
            const signature1 = ContractUtils.signShop(
                new Wallet(shop.wallet.privateKey),
                shop.shopId,
                await contracts.shop.nonceOf(shop.wallet.address)
            );
            await (
                await contracts.shop
                    .connect(sender)
                    .changeStatus(shop.shopId, ContractShopStatus.ACTIVE, shop.wallet.address, signature1)
            ).wait();
        }
    }

    public static getRandomPhoneNumber(): string {
        let res = "082999";
        for (let idx = 0; idx < 8; idx++) {
            res += Math.floor(Math.random() * 10).toString(10);
        }
        return res;
    }
}
