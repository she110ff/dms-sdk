import ganache from "ganache";
import * as dotenv from "dotenv";
import { Wallet } from "ethers";

dotenv.config({ path: "env/.env" });

export async function start() {
    const server = ganache.server({
        chain: {
            chainId: 24680
        },
        miner: {
            blockGasLimit: 80000000,
            defaultGasPrice: 800
        },
        logging: {
            quiet: true
        },
        wallet: {
            accounts: getAccounts()
        }
    });
    await server.listen(7545);
    return server;
}

function getAccounts(): any[] {
    const accounts: string[] = [];
    const reg_bytes64: RegExp = /^(0x)[0-9a-f]{64}$/i;
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

    if (process.env.OWNER !== undefined && process.env.OWNER.trim() !== "" && reg_bytes64.test(process.env.OWNER)) {
        accounts.push(process.env.OWNER);
    } else {
        process.env.OWNER = Wallet.createRandom().privateKey;
        accounts.push(process.env.OWNER);
    }

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

    if (process.env.USER1 !== undefined && process.env.USER1.trim() !== "" && reg_bytes64.test(process.env.USER1)) {
        accounts.push(process.env.USER1);
    } else {
        process.env.USER1 = Wallet.createRandom().privateKey;
        accounts.push(process.env.USER1);
    }

    if (process.env.USER2 !== undefined && process.env.USER2.trim() !== "" && reg_bytes64.test(process.env.USER2)) {
        accounts.push(process.env.USER2);
    } else {
        process.env.USER2 = Wallet.createRandom().privateKey;
        accounts.push(process.env.USER2);
    }
    return accounts;
}
