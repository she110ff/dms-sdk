export const SupportedNetworksArray = ["bosagora_mainnet", "bosagora_testnet", "bosagora_devnet", "localhost"] as const;
export type SupportedNetworks = typeof SupportedNetworksArray[number];
export type NetworkDeployment = {
    EmailLinkCollectionAddress: string;
    TokenAddress: string;
    ValidatorCollectionAddress: string;
    TokenPriceAddress: string;
    ShopCollectionAddress: string;
    LedgerAddress: string;
    relayEndpoint?: string | URL;
};
export type GenericRecord = Record<string, string | number | boolean | null | undefined>;

export interface IHttpConfig {
    /** IPFS Cluster URL */
    url: URL;
    /** Additional headers to be included with requests */
    headers?: Record<string, string>;
}
