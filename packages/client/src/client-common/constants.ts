import { NetworkDeployment, SupportedNetworks } from "./interfaces/common";
import { activeContractsList } from "dms-osx-lib";

export const LIVE_CONTRACTS: { [K in SupportedNetworks]: NetworkDeployment } = {
    bosagora_mainnet: {
        LinkCollection: activeContractsList.bosagora_mainnet.LinkCollection,
        Token: activeContractsList.bosagora_mainnet.Token,
        ValidatorCollection: activeContractsList.bosagora_mainnet.ValidatorCollection,
        TokenPrice: activeContractsList.bosagora_mainnet.TokenPrice,
        FranchiseeCollection: activeContractsList.bosagora_mainnet.FranchiseeCollection,
        Ledger: activeContractsList.bosagora_mainnet.Ledger
    },
    bosagora_testnet: {
        LinkCollection: activeContractsList.bosagora_testnet.LinkCollection,
        Token: activeContractsList.bosagora_testnet.Token,
        ValidatorCollection: activeContractsList.bosagora_testnet.ValidatorCollection,
        TokenPrice: activeContractsList.bosagora_testnet.TokenPrice,
        FranchiseeCollection: activeContractsList.bosagora_testnet.FranchiseeCollection,
        Ledger: activeContractsList.bosagora_testnet.Ledger
    },
    bosagora_devnet: {
        LinkCollection: activeContractsList.bosagora_devnet.LinkCollection,
        Token: activeContractsList.bosagora_devnet.Token,
        ValidatorCollection: activeContractsList.bosagora_devnet.ValidatorCollection,
        TokenPrice: activeContractsList.bosagora_devnet.TokenPrice,
        FranchiseeCollection: activeContractsList.bosagora_devnet.FranchiseeCollection,
        Ledger: activeContractsList.bosagora_devnet.Ledger
    }
};
