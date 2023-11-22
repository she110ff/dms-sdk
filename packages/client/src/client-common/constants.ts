import { NetworkDeployment, SupportedNetworks } from "./interfaces/common";
import { activeContractsList as dmsActiveContractList } from "dms-osx-lib";
import { activeContractsList as delActiveContractList } from "del-osx-lib";

export const LIVE_CONTRACTS: { [K in SupportedNetworks]: NetworkDeployment } = {
    bosagora_mainnet: {
        PhoneLinkCollectionAddress: delActiveContractList.bosagora_mainnet.PhoneLinkCollection,
        TokenAddress: dmsActiveContractList.bosagora_mainnet.Token,
        ValidatorCollectionAddress: dmsActiveContractList.bosagora_mainnet.ValidatorCollection,
        CurrencyRateAddress: dmsActiveContractList.bosagora_mainnet.CurrencyRate,
        ShopCollectionAddress: dmsActiveContractList.bosagora_mainnet.ShopCollection,
        LedgerAddress: dmsActiveContractList.bosagora_mainnet.Ledger,
        relayEndpoint: "http://relay.devnet.bosagora.org:7070/"
    },
    bosagora_testnet: {
        PhoneLinkCollectionAddress: delActiveContractList.bosagora_testnet.PhoneLinkCollection,
        TokenAddress: dmsActiveContractList.bosagora_testnet.Token,
        ValidatorCollectionAddress: dmsActiveContractList.bosagora_testnet.ValidatorCollection,
        CurrencyRateAddress: dmsActiveContractList.bosagora_testnet.CurrencyRate,
        ShopCollectionAddress: dmsActiveContractList.bosagora_testnet.ShopCollection,
        LedgerAddress: dmsActiveContractList.bosagora_testnet.Ledger,
        relayEndpoint: "http://relay.devnet.bosagora.org:7070/"
    },
    bosagora_devnet: {
        PhoneLinkCollectionAddress: delActiveContractList.bosagora_devnet.PhoneLinkCollection,
        TokenAddress: dmsActiveContractList.bosagora_devnet.Token,
        ValidatorCollectionAddress: dmsActiveContractList.bosagora_devnet.ValidatorCollection,
        CurrencyRateAddress: dmsActiveContractList.bosagora_devnet.CurrencyRate,
        ShopCollectionAddress: dmsActiveContractList.bosagora_devnet.ShopCollection,
        LedgerAddress: dmsActiveContractList.bosagora_devnet.Ledger,
        relayEndpoint: "http://relay.devnet.bosagora.org:7070/"
    },
    localhost: {
        PhoneLinkCollectionAddress: "",
        TokenAddress: "",
        ValidatorCollectionAddress: "",
        CurrencyRateAddress: "",
        ShopCollectionAddress: "",
        LedgerAddress: "",
        relayEndpoint: ""
    }
};
