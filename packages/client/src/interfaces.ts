import { BigNumberish } from "@ethersproject/bignumber";
import { BigNumber } from "@ethersproject/bignumber";
import { Signer } from "@ethersproject/abstract-signer";
import { JsonRpcProvider, Networkish } from "@ethersproject/providers";

export type PurchaseParam = {
    purchaseId: string;
    amount: BigNumberish;
    userEmail: string;
    shopId: string;
};

export type SingPaymentParam = {
    signer: Signer;
    purchaseId: string;
    amount: BigNumberish;
    userEmail: string;
    shopId: string;
    nonce: BigNumberish;
};

export type ClientParams = {
    network?: Networkish;
    signer?: Signer;
    web3Provider?: JsonRpcProvider;
    relayEndpoint?: string;
};

export enum PayPointSteps {
    PREPARED = "prepare",
    SENT = "sent",
    DONE = "done"
}

export type PayPointStepValue =
    | {
          key: PayPointSteps.PREPARED;
          purchaseId: string;
          amount: BigNumber;
          currency: string;
          shopId: string;
          account: string;
          signature: string;
      }
    | { key: PayPointSteps.SENT; txHash: string; purchaseId: string }
    | {
          key: PayPointSteps.DONE;
          purchaseId: string;
          currency: string;
          shopId: string;
          paidPoint: BigNumber;
          feePoint: BigNumber;
          balancePoint: BigNumber;
          purchaseAmount: BigNumber;
      };

export enum PayTokenSteps {
    PREPARED = "prepare",
    SENT = "sent",
    DONE = "done"
}

export type PayTokenStepValue =
    | {
          key: PayTokenSteps.PREPARED;
          purchaseId: string;
          amount: BigNumber;
          currency: string;
          shopId: string;
          account: string;
          signature: string;
      }
    | { key: PayTokenSteps.SENT; txHash: string; purchaseId: string }
    | {
          key: PayTokenSteps.DONE;
          purchaseId: string;
          currency: string;
          shopId: string;
          paidToken: BigNumber;
          feeToken: BigNumber;
          balanceToken: BigNumber;
          purchaseAmount: BigNumber;
      };

export enum DepositSteps {
    CHECKED_ALLOWANCE = "checkedAllowance",
    UPDATING_ALLOWANCE = "updatingAllowance",
    UPDATED_ALLOWANCE = "updatedAllowance",
    DEPOSITING = "depositing",
    DONE = "done"
}
export type UpdateAllowanceStepValue =
    | { key: DepositSteps.CHECKED_ALLOWANCE; allowance: BigNumber }
    | { key: DepositSteps.UPDATING_ALLOWANCE; txHash: string }
    | { key: DepositSteps.UPDATED_ALLOWANCE; allowance: BigNumber };

export type DepositStepValue =
    | UpdateAllowanceStepValue
    | { key: DepositSteps.DEPOSITING; txHash: string }
    | { key: DepositSteps.DONE; amount: BigNumber };

export type UpdateAllowanceParams = {
    targetAddress: string;
    amount: BigNumber;
    tokenAddress: string;
};

export enum WithdrawSteps {
    WITHDRAWING = "withdrawing",
    DONE = "done"
}

export type WithdrawStepValue =
    | { key: WithdrawSteps.WITHDRAWING; txHash: string }
    | { key: WithdrawSteps.DONE; amount: BigNumber };

export enum RoyaltyType {
    POINT,
    TOKEN
}

export enum ChangeRoyaltyTypeSteps {
    PREPARED = "prepare",
    SENT = "sent",
    DONE = "done"
}

export type ChangeRoyaltyTypeStepValue =
    | {
          key: ChangeRoyaltyTypeSteps.PREPARED;
          type: RoyaltyType;
          account: string;
          signature: string;
      }
    | { key: ChangeRoyaltyTypeSteps.SENT; txHash: string }
    | { key: ChangeRoyaltyTypeSteps.DONE; type: RoyaltyType };

export enum ChangeToPayablePointSteps {
    PREPARED = "prepare",
    SENT = "sent",
    DONE = "done"
}

export type ChangeToPayablePointStepValue =
    | {
          key: ChangeToPayablePointSteps.PREPARED;
          phone: string;
          phoneHash: string;
          account: string;
          signature: string;
          balance: BigNumberish;
      }
    | { key: ChangeToPayablePointSteps.SENT; txHash: string }
    | { key: ChangeToPayablePointSteps.DONE };

export enum SortDirection {
    ASC = "asc",
    DESC = "desc"
}

export type QueryOption = {
    limit?: number;
    skip?: number;
    sortDirection?: SortDirection;
    sortBy?: SortByBlock;
};

export enum SortByBlock {
    BLOCK_NUMBER = "blockNumber",
    BLOCK_TIMESTAMP = "blockTimestamp"
}
export enum SortBy {
    LAST_UPDATED = "lastUpdated",
    CREATED_AT = "createdAt"
}
