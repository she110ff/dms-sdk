import { NetworkDeployment, SupportedNetworks } from "./interfaces/common";
import { activeContractsList as dmsActiveContractList } from "dms-osx-lib";
import { activeContractsList as delActiveContractList } from "del-osx-lib";
import * as dotenv from "dotenv";

dotenv.config({ path: "env/.env" });

export const LIVE_CONTRACTS: { [K in SupportedNetworks]: NetworkDeployment } = {
    bosagora_mainnet: {
        EmailLinkCollectionAddress: delActiveContractList.bosagora_mainnet.EmailLinkCollection,
        TokenAddress: dmsActiveContractList.bosagora_mainnet.Token,
        ValidatorCollectionAddress: dmsActiveContractList.bosagora_mainnet.ValidatorCollection,
        TokenPriceAddress: dmsActiveContractList.bosagora_mainnet.TokenPrice,
        ShopCollectionAddress: dmsActiveContractList.bosagora_mainnet.ShopCollection,
        LedgerAddress: dmsActiveContractList.bosagora_mainnet.Ledger,
        relayEndpoint: process.env.MAINNET_RELAY_SERVER_URL
    },
    bosagora_testnet: {
        EmailLinkCollectionAddress: delActiveContractList.bosagora_testnet.EmailLinkCollection,
        TokenAddress: dmsActiveContractList.bosagora_testnet.Token,
        ValidatorCollectionAddress: dmsActiveContractList.bosagora_testnet.ValidatorCollection,
        TokenPriceAddress: dmsActiveContractList.bosagora_testnet.TokenPrice,
        ShopCollectionAddress: dmsActiveContractList.bosagora_testnet.ShopCollection,
        LedgerAddress: dmsActiveContractList.bosagora_testnet.Ledger,
        relayEndpoint: process.env.TESTNET_RELAY_SERVER_URL
    },
    bosagora_devnet: {
        EmailLinkCollectionAddress: delActiveContractList.bosagora_devnet.EmailLinkCollection,
        TokenAddress: dmsActiveContractList.bosagora_devnet.Token,
        ValidatorCollectionAddress: dmsActiveContractList.bosagora_devnet.ValidatorCollection,
        TokenPriceAddress: dmsActiveContractList.bosagora_devnet.TokenPrice,
        ShopCollectionAddress: dmsActiveContractList.bosagora_devnet.ShopCollection,
        LedgerAddress: dmsActiveContractList.bosagora_devnet.Ledger,
        relayEndpoint: process.env.DEVNET_RELAY_SERVER_URL
    },
    localhost: {
        EmailLinkCollectionAddress: "",
        TokenAddress: "",
        ValidatorCollectionAddress: "",
        TokenPriceAddress: "",
        ShopCollectionAddress: "",
        LedgerAddress: "",
        relayEndpoint: ""
    }
};
