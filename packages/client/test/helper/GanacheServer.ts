import ganache, { Server } from "ganache";
import * as dotenv from "dotenv";
import { contextParamsLocalChain } from "./constants";
import { Signer } from "@ethersproject/abstract-signer";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";

dotenv.config({ path: "env/.env" });

export enum AccountIndex {
    DEPLOYER,
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
    USER1,
    USER2,
    USER3,
    USER4,
    USER5,
    SHOP1,
    SHOP2,
    SHOP3,
    SHOP4,
    SHOP5,
    SHOP6
}

export class GanacheServer {
    public static instance: Server;
    public static initialAccounts: any[];
    public static CHAIN_ID = 24680;
    public static PORT = 7545;

    public static async start() {
        if (GanacheServer.initialAccounts === undefined) {
            GanacheServer.initialAccounts = GanacheServer.CreateInitialAccounts();
        }

        GanacheServer.instance = ganache.server({
            chain: {
                chainId: GanacheServer.CHAIN_ID
            },
            miner: {
                blockGasLimit: 80000000,
                defaultGasPrice: 800
            },
            logging: {
                quiet: true
            },
            wallet: {
                accounts: GanacheServer.initialAccounts
            }
        });
        await GanacheServer.instance.listen(GanacheServer.PORT);
        return GanacheServer.instance;
    }

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

        // 2
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

        // 3
        if (process.env.FEE !== undefined && process.env.FEE.trim() !== "" && reg_bytes64.test(process.env.FEE)) {
            accounts.push(process.env.FEE);
        } else {
            process.env.FEE = Wallet.createRandom().privateKey;
            accounts.push(process.env.FEE);
        }

        // 4
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

        // 5
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

        // 6
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

        // 7
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

        // 8
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

        // 9
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

        // 10
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

        // 11
        if (process.env.USER1 !== undefined && process.env.USER1.trim() !== "" && reg_bytes64.test(process.env.USER1)) {
            accounts.push(process.env.USER1);
        } else {
            process.env.USER1 = Wallet.createRandom().privateKey;
            accounts.push(process.env.USER1);
        }

        // 12
        if (process.env.USER2 !== undefined && process.env.USER2.trim() !== "" && reg_bytes64.test(process.env.USER2)) {
            accounts.push(process.env.USER2);
        } else {
            process.env.USER2 = Wallet.createRandom().privateKey;
            accounts.push(process.env.USER2);
        }

        // 13
        if (process.env.USER3 !== undefined && process.env.USER3.trim() !== "" && reg_bytes64.test(process.env.USER3)) {
            accounts.push(process.env.USER3);
        } else {
            process.env.USER3 = Wallet.createRandom().privateKey;
            accounts.push(process.env.USER3);
        }

        // 14
        if (process.env.USER4 !== undefined && process.env.USER4.trim() !== "" && reg_bytes64.test(process.env.USER4)) {
            accounts.push(process.env.USER4);
        } else {
            process.env.USER4 = Wallet.createRandom().privateKey;
            accounts.push(process.env.USER4);
        }

        // 15
        if (process.env.USER5 !== undefined && process.env.USER5.trim() !== "" && reg_bytes64.test(process.env.USER5)) {
            accounts.push(process.env.USER5);
        } else {
            process.env.USER5 = Wallet.createRandom().privateKey;
            accounts.push(process.env.USER5);
        }

        // 16
        if (process.env.SHOP1 !== undefined && process.env.SHOP1.trim() !== "" && reg_bytes64.test(process.env.SHOP1)) {
            accounts.push(process.env.SHOP1);
        } else {
            process.env.SHOP1 = Wallet.createRandom().privateKey;
            accounts.push(process.env.SHOP1);
        }

        // 17
        if (process.env.SHOP2 !== undefined && process.env.SHOP2.trim() !== "" && reg_bytes64.test(process.env.SHOP2)) {
            accounts.push(process.env.SHOP2);
        } else {
            process.env.SHOP2 = Wallet.createRandom().privateKey;
            accounts.push(process.env.SHOP2);
        }

        // 18
        if (process.env.SHOP3 !== undefined && process.env.SHOP3.trim() !== "" && reg_bytes64.test(process.env.SHOP3)) {
            accounts.push(process.env.SHOP3);
        } else {
            process.env.SHOP3 = Wallet.createRandom().privateKey;
            accounts.push(process.env.SHOP3);
        }

        // 19
        if (process.env.SHOP4 !== undefined && process.env.SHOP4.trim() !== "" && reg_bytes64.test(process.env.SHOP4)) {
            accounts.push(process.env.SHOP4);
        } else {
            process.env.SHOP4 = Wallet.createRandom().privateKey;
            accounts.push(process.env.SHOP4);
        }

        // 20
        if (process.env.SHOP5 !== undefined && process.env.SHOP5.trim() !== "" && reg_bytes64.test(process.env.SHOP5)) {
            accounts.push(process.env.SHOP5);
        } else {
            process.env.SHOP5 = Wallet.createRandom().privateKey;
            accounts.push(process.env.SHOP5);
        }

        // 21
        if (process.env.SHOP6 !== undefined && process.env.SHOP6.trim() !== "" && reg_bytes64.test(process.env.SHOP6)) {
            accounts.push(process.env.SHOP6);
        } else {
            process.env.SHOP6 = Wallet.createRandom().privateKey;
            accounts.push(process.env.SHOP6);
        }

        return accounts.map((m) => {
            return {
                balance: "0x100000000000000000000",
                secretKey: m
            };
        });
    }

    public static accounts(): Wallet[] {
        if (GanacheServer.initialAccounts === undefined) {
            GanacheServer.initialAccounts = GanacheServer.CreateInitialAccounts();
        }
        return GanacheServer.initialAccounts.map((m) =>
            new Wallet(m.secretKey).connect(GanacheServer.createTestProvider())
        );
    }

    public static createTestProvider(): JsonRpcProvider {
        return new JsonRpcProvider(`http://localhost:${GanacheServer.PORT}`, GanacheServer.CHAIN_ID);
    }

    public static setTestProvider(provider: JsonRpcProvider) {
        contextParamsLocalChain.web3Providers = provider;
    }

    public static setTestWeb3Signer(signer: Signer) {
        contextParamsLocalChain.signer = signer;
    }
}
