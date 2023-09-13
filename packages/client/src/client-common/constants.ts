import { NetworkDeployment, SupportedNetworks } from "./interfaces/common";
import { activeContractsList as dmsActiveContractList } from "dms-osx-lib";
import { activeContractsList as delActiveContractList } from "del-osx-lib";
import * as dotenv from "dotenv";

dotenv.config({ path: "env/.env" });

export const LIVE_CONTRACTS: { [K in SupportedNetworks]: NetworkDeployment } = {
    bosagora_mainnet: {
        LinkCollectionAddress: delActiveContractList.bosagora_mainnet.LinkCollection,
        TokenAddress: dmsActiveContractList.bosagora_mainnet.Token,
        ValidatorCollectionAddress: dmsActiveContractList.bosagora_mainnet.ValidatorCollection,
        TokenPriceAddress: dmsActiveContractList.bosagora_mainnet.TokenPrice,
        FranchiseeCollectionAddress: dmsActiveContractList.bosagora_mainnet.FranchiseeCollection,
        LedgerAddress: dmsActiveContractList.bosagora_mainnet.Ledger,
        relayEndpoint: process.env.MAINNET_RELAY_SERVER_URL
    },
    bosagora_testnet: {
        LinkCollectionAddress: delActiveContractList.bosagora_testnet.LinkCollection,
        TokenAddress: dmsActiveContractList.bosagora_testnet.Token,
        ValidatorCollectionAddress: dmsActiveContractList.bosagora_testnet.ValidatorCollection,
        TokenPriceAddress: dmsActiveContractList.bosagora_testnet.TokenPrice,
        FranchiseeCollectionAddress: dmsActiveContractList.bosagora_testnet.FranchiseeCollection,
        LedgerAddress: dmsActiveContractList.bosagora_testnet.Ledger,
        relayEndpoint: process.env.TESTNET_RELAY_SERVER_URL
    },
    bosagora_devnet: {
        LinkCollectionAddress: delActiveContractList.bosagora_devnet.LinkCollection,
        TokenAddress: dmsActiveContractList.bosagora_devnet.Token,
        ValidatorCollectionAddress: dmsActiveContractList.bosagora_devnet.ValidatorCollection,
        TokenPriceAddress: dmsActiveContractList.bosagora_devnet.TokenPrice,
        FranchiseeCollectionAddress: dmsActiveContractList.bosagora_devnet.FranchiseeCollection,
        LedgerAddress: dmsActiveContractList.bosagora_devnet.Ledger,
        relayEndpoint: process.env.DEVNET_RELAY_SERVER_URL
    },
    localhost: {
        LinkCollectionAddress: "",
        TokenAddress: "",
        ValidatorCollectionAddress: "",
        TokenPriceAddress: "",
        FranchiseeCollectionAddress: "",
        LedgerAddress: "",
        relayEndpoint: ""
    }
};
