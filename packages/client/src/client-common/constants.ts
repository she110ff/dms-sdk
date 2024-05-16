import { NetworkDeployment, SupportedNetwork } from "./interfaces/common";
import { activeContractsList as dmsActiveContractList } from "dms-osx-lib";
import { activeContractsList as delActiveContractList } from "del-osx-lib";
import { Network } from "@ethersproject/networks";

export const LIVE_CONTRACTS: { [K in SupportedNetwork]: NetworkDeployment } = {
    loyalty_mainnet: {
        PhoneLinkCollectionAddress: delActiveContractList.loyalty_mainnet.PhoneLinkCollection,
        LoyaltyTokenAddress: dmsActiveContractList.loyalty_mainnet.LoyaltyToken,
        ValidatorAddress: dmsActiveContractList.loyalty_mainnet.Validator,
        CurrencyRateAddress: dmsActiveContractList.loyalty_mainnet.CurrencyRate,
        ShopAddress: dmsActiveContractList.loyalty_mainnet.Shop,
        LedgerAddress: dmsActiveContractList.loyalty_mainnet.Ledger,
        LoyaltyProviderAddress: dmsActiveContractList.loyalty_mainnet.LoyaltyProvider,
        LoyaltyConsumerAddress: dmsActiveContractList.loyalty_mainnet.LoyaltyConsumer,
        LoyaltyExchangerAddress: dmsActiveContractList.loyalty_mainnet.LoyaltyExchanger,
        LoyaltyTransferAddress: dmsActiveContractList.loyalty_mainnet.LoyaltyTransfer,
        LoyaltyBridgeAddress: dmsActiveContractList.loyalty_mainnet.LoyaltyBridge,
        network: 215110,
        web3Endpoint: "https://rpc.kios.bosagora.org/",
        relayEndpoint: "https://relay.kios.bosagora.org/",
        graphqlEndpoint: "https://graph.kios.bosagora.org/subgraphs/name/bosagora/dms-osx-sidemainnet"
    },
    loyalty_testnet: {
        PhoneLinkCollectionAddress: delActiveContractList.loyalty_testnet.PhoneLinkCollection,
        LoyaltyTokenAddress: dmsActiveContractList.loyalty_testnet.LoyaltyToken,
        ValidatorAddress: dmsActiveContractList.loyalty_testnet.Validator,
        CurrencyRateAddress: dmsActiveContractList.loyalty_testnet.CurrencyRate,
        ShopAddress: dmsActiveContractList.loyalty_testnet.Shop,
        LedgerAddress: dmsActiveContractList.loyalty_testnet.Ledger,
        LoyaltyProviderAddress: dmsActiveContractList.loyalty_testnet.LoyaltyProvider,
        LoyaltyConsumerAddress: dmsActiveContractList.loyalty_testnet.LoyaltyConsumer,
        LoyaltyExchangerAddress: dmsActiveContractList.loyalty_testnet.LoyaltyExchanger,
        LoyaltyTransferAddress: dmsActiveContractList.loyalty_testnet.LoyaltyTransfer,
        LoyaltyBridgeAddress: dmsActiveContractList.loyalty_testnet.LoyaltyBridge,
        network: 215115,
        web3Endpoint: "https://rpc.test.kios.bosagora.org/",
        relayEndpoint: "https://relay.test.kios.bosagora.org/",
        graphqlEndpoint: "https://graph.test.kios.bosagora.org/subgraphs/name/bosagora/dms-osx-sidetestnet"
    },
    loyalty_devnet: {
        PhoneLinkCollectionAddress: delActiveContractList.loyalty_devnet.PhoneLinkCollection,
        LoyaltyTokenAddress: dmsActiveContractList.loyalty_devnet.LoyaltyToken,
        ValidatorAddress: dmsActiveContractList.loyalty_devnet.Validator,
        CurrencyRateAddress: dmsActiveContractList.loyalty_devnet.CurrencyRate,
        ShopAddress: dmsActiveContractList.loyalty_devnet.Shop,
        LedgerAddress: dmsActiveContractList.loyalty_devnet.Ledger,
        LoyaltyProviderAddress: dmsActiveContractList.loyalty_devnet.LoyaltyProvider,
        LoyaltyConsumerAddress: dmsActiveContractList.loyalty_devnet.LoyaltyConsumer,
        LoyaltyExchangerAddress: dmsActiveContractList.loyalty_devnet.LoyaltyExchanger,
        LoyaltyTransferAddress: dmsActiveContractList.loyalty_devnet.LoyaltyTransfer,
        LoyaltyBridgeAddress: dmsActiveContractList.loyalty_devnet.LoyaltyBridge,
        network: 24680,
        web3Endpoint: '"http://rpc-side.dev.lyt.bosagora.org:8545/',
        relayEndpoint: "http://relay.dev.lyt.bosagora.org:7070/",
        graphqlEndpoint: "http://subgraph.dev.lyt.bosagora.org:8000/subgraphs/name/bosagora/dms-osx-sidechain"
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
        name: SupportedNetwork.LOYALTY_MAINNET,
        chainId: 215110
    },
    {
        name: SupportedNetwork.LOYALTY_TESTNET,
        chainId: 215115
    },
    {
        name: SupportedNetwork.LOYALTY_DEVNET,
        chainId: 24680
    }
];
