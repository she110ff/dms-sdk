export const SupportedNetworksArray = ["bosagora_mainnet", "bosagora_testnet", "bosagora_devnet", "localhost"] as const;
export type SupportedNetworks = typeof SupportedNetworksArray[number];
export type NetworkDeployment = {
    LinkCollection: string;
    Token: string;
    ValidatorCollection: string;
    TokenPrice: string;
    FranchiseeCollection: string;
    Ledger: string;
};

export type GasFeeEstimation = {
    average: bigint;
    max: bigint;
};

export interface IPagination {
    skip?: number;
    limit?: number;
    direction?: SortDirection;
}

export type Pagination = {
    skip?: number;
    limit?: number;
    direction?: SortDirection;
};

export enum SortDirection {
    ASC = "asc",
    DESC = "desc"
}

export interface IInterfaceParams {
    id: string;
    functionName: string;
    hash: string;
}
