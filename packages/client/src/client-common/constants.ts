import { NetworkDeployment, SupportedNetworks } from "./interfaces/common";
import { activeContractsList as dmsActiveContractList } from "dms-osx-lib";
import { activeContractsList as delActiveContractList } from "del-osx-lib";
import * as dotenv from "dotenv";

dotenv.config({ path: "env/.env" });

export const LIVE_CONTRACTS: { [K in SupportedNetworks]: NetworkDeployment } = {
    bosagora_mainnet: {
        LinkCollection: delActiveContractList.bosagora_mainnet.LinkCollection,
        Token: dmsActiveContractList.bosagora_mainnet.Token,
        ValidatorCollection: dmsActiveContractList.bosagora_mainnet.ValidatorCollection,
        TokenPrice: dmsActiveContractList.bosagora_mainnet.TokenPrice,
        FranchiseeCollection: dmsActiveContractList.bosagora_mainnet.FranchiseeCollection,
        Ledger: dmsActiveContractList.bosagora_mainnet.Ledger,
        relayEndpoint: process.env.MAINNET_RELAY_SERVER_URL
    },
    bosagora_testnet: {
        LinkCollection: delActiveContractList.bosagora_testnet.LinkCollection,
        Token: dmsActiveContractList.bosagora_testnet.Token,
        ValidatorCollection: dmsActiveContractList.bosagora_testnet.ValidatorCollection,
        TokenPrice: dmsActiveContractList.bosagora_testnet.TokenPrice,
        FranchiseeCollection: dmsActiveContractList.bosagora_testnet.FranchiseeCollection,
        Ledger: dmsActiveContractList.bosagora_testnet.Ledger,
        relayEndpoint: process.env.TESTNET_RELAY_SERVER_URL
    },
    bosagora_devnet: {
        LinkCollection: delActiveContractList.bosagora_devnet.LinkCollection,
        Token: dmsActiveContractList.bosagora_devnet.Token,
        ValidatorCollection: dmsActiveContractList.bosagora_devnet.ValidatorCollection,
        TokenPrice: dmsActiveContractList.bosagora_devnet.TokenPrice,
        FranchiseeCollection: dmsActiveContractList.bosagora_devnet.FranchiseeCollection,
        Ledger: dmsActiveContractList.bosagora_devnet.Ledger,
        relayEndpoint: process.env.DEVNET_RELAY_SERVER_URL
    },
    localhost: {
        LinkCollection: "",
        Token: "",
        ValidatorCollection: "",
        TokenPrice: "",
        FranchiseeCollection: "",
        Ledger: "",
        relayEndpoint: ""
    }
};
