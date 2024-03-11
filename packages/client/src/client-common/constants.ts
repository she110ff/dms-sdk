import { NetworkDeployment, SupportedNetwork } from "./interfaces/common";
import { activeContractsList as dmsActiveContractList } from "dms-osx-lib";
import { activeContractsList as delActiveContractList } from "del-osx-lib";
import { Network } from "@ethersproject/networks";

export const LIVE_CONTRACTS: { [K in SupportedNetwork]: NetworkDeployment } = {
    bosagora_devnet: {
        PhoneLinkCollectionAddress: delActiveContractList.bosagora_devnet.PhoneLinkCollection,
        LoyaltyTokenAddress: dmsActiveContractList.bosagora_devnet.LoyaltyToken,
        ValidatorAddress: dmsActiveContractList.bosagora_devnet.Validator,
        CurrencyRateAddress: dmsActiveContractList.bosagora_devnet.CurrencyRate,
        ShopAddress: dmsActiveContractList.bosagora_devnet.Shop,
        LedgerAddress: dmsActiveContractList.bosagora_devnet.Ledger,
        LoyaltyProviderAddress: dmsActiveContractList.bosagora_devnet.LoyaltyProvider,
        LoyaltyConsumerAddress: dmsActiveContractList.bosagora_devnet.LoyaltyConsumer,
        LoyaltyExchangerAddress: dmsActiveContractList.bosagora_devnet.LoyaltyExchanger,
        LoyaltyTransferAddress: dmsActiveContractList.bosagora_devnet.LoyaltyTransfer,
        LoyaltyBridgeAddress: dmsActiveContractList.bosagora_devnet.LoyaltyBridge,
        network: 24680,
        web3Endpoint: "https://rpc.kios.bosagora.org/",
        relayEndpoint: "https://relay.kios.bosagora.org/",
        graphqlEndpoint: "https://graph.test.kios.bosagora.org/subgraphs/name/bosagora/dms-osx-side_mainnet"
    },
    kios_mainnet: {
        PhoneLinkCollectionAddress: delActiveContractList.kios_mainnet.PhoneLinkCollection,
        LoyaltyTokenAddress: dmsActiveContractList.kios_mainnet.LoyaltyToken,
        ValidatorAddress: dmsActiveContractList.kios_mainnet.Validator,
        CurrencyRateAddress: dmsActiveContractList.kios_mainnet.CurrencyRate,
        ShopAddress: dmsActiveContractList.kios_mainnet.Shop,
        LedgerAddress: dmsActiveContractList.kios_mainnet.Ledger,
        LoyaltyProviderAddress: dmsActiveContractList.kios_mainnet.LoyaltyProvider,
        LoyaltyConsumerAddress: dmsActiveContractList.kios_mainnet.LoyaltyConsumer,
        LoyaltyExchangerAddress: dmsActiveContractList.kios_mainnet.LoyaltyExchanger,
        LoyaltyTransferAddress: dmsActiveContractList.kios_mainnet.LoyaltyTransfer,
        LoyaltyBridgeAddress: dmsActiveContractList.kios_mainnet.LoyaltyBridge,
        network: 215110,
        web3Endpoint: "https://rpc.kios.bosagora.org/",
        relayEndpoint: "https://relay.kios.bosagora.org/",
        graphqlEndpoint: "https://graph.test.kios.bosagora.org/subgraphs/name/bosagora/dms-osx-side_mainnet"
    },
    kios_testnet: {
        PhoneLinkCollectionAddress: delActiveContractList.kios_testnet.PhoneLinkCollection,
        LoyaltyTokenAddress: dmsActiveContractList.kios_testnet.LoyaltyToken,
        ValidatorAddress: dmsActiveContractList.kios_testnet.Validator,
        CurrencyRateAddress: dmsActiveContractList.kios_testnet.CurrencyRate,
        ShopAddress: dmsActiveContractList.kios_testnet.Shop,
        LedgerAddress: dmsActiveContractList.kios_testnet.Ledger,
        LoyaltyProviderAddress: dmsActiveContractList.kios_testnet.LoyaltyProvider,
        LoyaltyConsumerAddress: dmsActiveContractList.kios_testnet.LoyaltyConsumer,
        LoyaltyExchangerAddress: dmsActiveContractList.kios_testnet.LoyaltyExchanger,
        LoyaltyTransferAddress: dmsActiveContractList.kios_testnet.LoyaltyTransfer,
        LoyaltyBridgeAddress: dmsActiveContractList.kios_testnet.LoyaltyBridge,
        network: 215115,
        web3Endpoint: "https://rpc.test.kios.bosagora.org/",
        relayEndpoint: "https://relay.test.kios.bosagora.org/",
        graphqlEndpoint: "https://graph.test.kios.bosagora.org/subgraphs/name/bosagora/dms-osx-side_testnet"
    },
    kios_devnet: {
        PhoneLinkCollectionAddress: delActiveContractList.kios_devnet.PhoneLinkCollection,
        LoyaltyTokenAddress: dmsActiveContractList.kios_devnet.LoyaltyToken,
        ValidatorAddress: dmsActiveContractList.kios_devnet.Validator,
        CurrencyRateAddress: dmsActiveContractList.kios_devnet.CurrencyRate,
        ShopAddress: dmsActiveContractList.kios_devnet.Shop,
        LedgerAddress: dmsActiveContractList.kios_devnet.Ledger,
        LoyaltyProviderAddress: dmsActiveContractList.kios_devnet.LoyaltyProvider,
        LoyaltyConsumerAddress: dmsActiveContractList.kios_devnet.LoyaltyConsumer,
        LoyaltyExchangerAddress: dmsActiveContractList.kios_devnet.LoyaltyExchanger,
        LoyaltyTransferAddress: dmsActiveContractList.kios_devnet.LoyaltyTransfer,
        LoyaltyBridgeAddress: dmsActiveContractList.kios_devnet.LoyaltyBridge,
        network: 24680,
        web3Endpoint: '"http://rpc.devnet.bosagora.org:8545/',
        relayEndpoint: "http://relay.devnet.bosagora.org:7070/",
        graphqlEndpoint: "http://subgraph.devnet.bosagora.org:8000/subgraphs/name/bosagora/dms-osx-devnet"
    },
    localhost: {
        PhoneLinkCollectionAddress: "",
        LoyaltyTokenAddress: "",
        ValidatorAddress: "",
        CurrencyRateAddress: "",
        ShopAddress: "",
        LedgerAddress: "",
        LoyaltyProviderAddress: "",
        LoyaltyConsumerAddress: "",
        LoyaltyExchangerAddress: "",
        LoyaltyTransferAddress: "",
        LoyaltyBridgeAddress: "",
        network: 24680,
        web3Endpoint: '"http://localhost:8545/',
        relayEndpoint: "http://localhost:7070/",
        graphqlEndpoint: "http://localhost:8000/subgraphs/name/bosagora/dms-osx-devnet"
    }
};

export const ADDITIONAL_NETWORKS: Network[] = [
    {
        name: SupportedNetwork.BOSAGORA_DEVNET,
        chainId: 24680
    },
    {
        name: SupportedNetwork.KIOS_MAINNET,
        chainId: 215110
    },
    {
        name: SupportedNetwork.KIOS_TESTNET,
        chainId: 215115
    },
    {
        name: SupportedNetwork.KIOS_DEVNET,
        chainId: 24680
    }
];
