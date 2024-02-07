import { NetworkDeployment, SupportedNetworks } from "./interfaces/common";
import { activeContractsList as dmsActiveContractList } from "dms-osx-lib";
import { activeContractsList as delActiveContractList } from "del-osx-lib";

export const LIVE_CONTRACTS: { [K in SupportedNetworks]: NetworkDeployment } = {
    bosagora_mainnet: {
        PhoneLinkCollectionAddress: delActiveContractList.bosagora_mainnet.PhoneLinkCollection,
        TokenAddress: dmsActiveContractList.bosagora_mainnet.KIOS,
        ValidatorAddress: dmsActiveContractList.bosagora_mainnet.Validator,
        CurrencyRateAddress: dmsActiveContractList.bosagora_mainnet.CurrencyRate,
        ShopAddress: dmsActiveContractList.bosagora_mainnet.Shop,
        LedgerAddress: dmsActiveContractList.bosagora_mainnet.Ledger,
        LoyaltyProviderAddress: dmsActiveContractList.bosagora_mainnet.LoyaltyProvider,
        LoyaltyConsumerAddress: dmsActiveContractList.bosagora_mainnet.LoyaltyConsumer,
        LoyaltyExchangerAddress: dmsActiveContractList.bosagora_mainnet.LoyaltyExchanger,
        LoyaltyTransferAddress: dmsActiveContractList.bosagora_mainnet.LoyaltyTransfer,
        relayEndpoint: "http://relay.devnet.bosagora.org:7070/"
    },
    bosagora_testnet: {
        PhoneLinkCollectionAddress: delActiveContractList.bosagora_testnet.PhoneLinkCollection,
        TokenAddress: dmsActiveContractList.bosagora_testnet.KIOS,
        ValidatorAddress: dmsActiveContractList.bosagora_testnet.Validator,
        CurrencyRateAddress: dmsActiveContractList.bosagora_testnet.CurrencyRate,
        ShopAddress: dmsActiveContractList.bosagora_testnet.Shop,
        LedgerAddress: dmsActiveContractList.bosagora_testnet.Ledger,
        LoyaltyProviderAddress: dmsActiveContractList.bosagora_testnet.LoyaltyProvider,
        LoyaltyConsumerAddress: dmsActiveContractList.bosagora_testnet.LoyaltyConsumer,
        LoyaltyExchangerAddress: dmsActiveContractList.bosagora_testnet.LoyaltyExchanger,
        LoyaltyTransferAddress: dmsActiveContractList.bosagora_testnet.LoyaltyTransfer,
        relayEndpoint: "http://relay.devnet.bosagora.org:7070/"
    },
    bosagora_devnet: {
        PhoneLinkCollectionAddress: delActiveContractList.bosagora_devnet.PhoneLinkCollection,
        TokenAddress: dmsActiveContractList.bosagora_devnet.KIOS,
        ValidatorAddress: dmsActiveContractList.bosagora_devnet.Validator,
        CurrencyRateAddress: dmsActiveContractList.bosagora_devnet.CurrencyRate,
        ShopAddress: dmsActiveContractList.bosagora_devnet.Shop,
        LedgerAddress: dmsActiveContractList.bosagora_devnet.Ledger,
        LoyaltyProviderAddress: dmsActiveContractList.bosagora_devnet.LoyaltyProvider,
        LoyaltyConsumerAddress: dmsActiveContractList.bosagora_devnet.LoyaltyConsumer,
        LoyaltyExchangerAddress: dmsActiveContractList.bosagora_devnet.LoyaltyExchanger,
        LoyaltyTransferAddress: dmsActiveContractList.bosagora_devnet.LoyaltyTransfer,
        relayEndpoint: "http://relay.devnet.bosagora.org:7070/"
    },
    localhost: {
        PhoneLinkCollectionAddress: "",
        TokenAddress: "",
        ValidatorAddress: "",
        CurrencyRateAddress: "",
        ShopAddress: "",
        LedgerAddress: "",
        LoyaltyProviderAddress: "",
        LoyaltyConsumerAddress: "",
        LoyaltyExchangerAddress: "",
        LoyaltyTransferAddress: "",
        relayEndpoint: ""
    }
};
