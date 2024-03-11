import { Networkish } from "@ethersproject/providers";

export enum SupportedNetwork {
    BOSAGORA_DEVNET = "bosagora_devnet",
    KIOS_MAINNET = "kios_mainnet",
    KIOS_TESTNET = "kios_testnet",
    KIOS_DEVNET = "kios_devnet",
    BOSAGORA_LOCAL = "localhost"
}

export const SupportedNetworkArray = Object.values(SupportedNetwork);

export type NetworkDeployment = {
    PhoneLinkCollectionAddress: string;
    LoyaltyTokenAddress: string;
    ValidatorAddress: string;
    CurrencyRateAddress: string;
    ShopAddress: string;
    LedgerAddress: string;
    LoyaltyProviderAddress: string;
    LoyaltyConsumerAddress: string;
    LoyaltyExchangerAddress: string;
    LoyaltyTransferAddress: string;
    network: Networkish;
    LoyaltyBridgeAddress: string;
    web3Endpoint: string | URL;
    relayEndpoint: string | URL;
    graphqlEndpoint: string | URL;
};
export type GenericRecord = Record<string, string | number | boolean | null | undefined>;
