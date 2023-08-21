import { NetworkDeployment, SupportedNetworks } from "./interfaces/common";
import { activeContractsList } from "dms-osx-lib";

export const LIVE_CONTRACTS: { [K in SupportedNetworks]: NetworkDeployment } = {
    mainnet: {
        LinkCollection: activeContractsList.devnet.LinkCollection,
        Token: activeContractsList.devnet.Token,
        ValidatorCollection: activeContractsList.devnet.ValidatorCollection,
        TokenPrice: activeContractsList.devnet.TokenPrice,
        FranchiseeCollection: activeContractsList.devnet.FranchiseeCollection,
        Ledger: activeContractsList.devnet.Ledger
    },
    testnet: {
        LinkCollection: activeContractsList.devnet.LinkCollection,
        Token: activeContractsList.devnet.Token,
        ValidatorCollection: activeContractsList.devnet.ValidatorCollection,
        TokenPrice: activeContractsList.devnet.TokenPrice,
        FranchiseeCollection: activeContractsList.devnet.FranchiseeCollection,
        Ledger: activeContractsList.devnet.Ledger
    },
    localhost: {
        LinkCollection: activeContractsList.devnet.LinkCollection,
        Token: activeContractsList.devnet.Token,
        ValidatorCollection: activeContractsList.devnet.ValidatorCollection,
        TokenPrice: activeContractsList.devnet.TokenPrice,
        FranchiseeCollection: activeContractsList.devnet.FranchiseeCollection,
        Ledger: activeContractsList.devnet.Ledger
    }
};
