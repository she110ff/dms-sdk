import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { BytesLike } from "@ethersproject/bytes";

export const SignatureZero =
    "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

export enum NormalSteps {
    PREPARED = "prepare",
    SENT = "sent",
    DONE = "done",
    APPROVED = "approved",
    DENIED = "denied"
}

export enum PaymentDetailTaskStatus {
    NULL = 0,
    OPENED_NEW = 11,
    APPROVED_NEW_FAILED_TX = 12,
    APPROVED_NEW_REVERTED_TX = 13,
    APPROVED_NEW_SENT_TX = 14,
    APPROVED_NEW_CONFIRMED_TX = 15,
    DENIED_NEW = 16,
    REPLY_COMPLETED_NEW = 17,
    CLOSED_NEW = 18,
    FAILED_NEW = 19,
    OPENED_CANCEL = 51,
    APPROVED_CANCEL_FAILED_TX = 52,
    APPROVED_CANCEL_REVERTED_TX = 53,
    APPROVED_CANCEL_SENT_TX = 54,
    APPROVED_CANCEL_CONFIRMED_TX = 55,
    DENIED_CANCEL = 56,
    REPLY_COMPLETED_CANCEL = 57,
    CLOSED_CANCEL = 58,
    FAILED_CANCEL = 59
}

export interface PaymentDetailData {
    paymentId: BytesLike;
    purchaseId: string;
    amount: BigNumber;
    currency: string;
    shopId: BytesLike;
    account: string;
    loyaltyType: LoyaltyType;
    paidPoint: BigNumber;
    paidToken: BigNumber;
    paidValue: BigNumber;
    feePoint: BigNumber;
    feeToken: BigNumber;
    feeValue: BigNumber;
    totalPoint: BigNumber;
    totalToken: BigNumber;
    totalValue: BigNumber;
    paymentStatus: PaymentDetailTaskStatus;
}

export enum ShopDetailTaskStatus {
    NULL = 0,
    OPENED = 11,
    FAILED_TX = 12,
    REVERTED_TX = 13,
    SENT_TX = 14,
    DENIED = 15,
    COMPLETED = 16,
    TIMEOUT = 70
}

export interface ShopDetailData {
    taskId: BytesLike;
    shopId: BytesLike;
    name: string;
    account: string;
    taskStatus: ShopDetailTaskStatus;
    timestamp: number;
}

export type ApproveNewPaymentValue =
    | {
          key: NormalSteps.PREPARED;
          paymentId: BytesLike;
          purchaseId: string;
          amount: BigNumber;
          currency: string;
          shopId: BytesLike;
          approval: boolean;
          account: string;
          signature: BytesLike;
      }
    | {
          key: NormalSteps.SENT;
          paymentId: BytesLike;
          purchaseId: string;
          amount: BigNumber;
          currency: string;
          shopId: BytesLike;
          approval: boolean;
          account: string;
          txHash: BytesLike;
      }
    | {
          key: NormalSteps.APPROVED;
          paymentId: BytesLike;
          purchaseId: string;
          amount: BigNumber;
          currency: string;
          shopId: BytesLike;
          approval: boolean;
          account: string;
          loyaltyType: LoyaltyType;
          paidPoint: BigNumber;
          paidToken: BigNumber;
          paidValue: BigNumber;
          feePoint: BigNumber;
          feeToken: BigNumber;
          feeValue: BigNumber;
          totalPoint: BigNumber;
          totalToken: BigNumber;
          totalValue: BigNumber;
      }
    | {
          key: NormalSteps.DENIED;
          paymentId: BytesLike;
          purchaseId: string;
          amount: BigNumber;
          currency: string;
          shopId: BytesLike;
          approval: boolean;
          account: string;
      };

export type ApproveCancelPaymentValue =
    | {
          key: NormalSteps.PREPARED;
          paymentId: BytesLike;
          purchaseId: string;
          approval: boolean;
          account: string;
          signature: BytesLike;
      }
    | {
          key: NormalSteps.SENT;
          paymentId: BytesLike;
          purchaseId: string;
          approval: boolean;
          account: string;
          txHash: BytesLike;
      }
    | {
          key: NormalSteps.APPROVED;
          paymentId: BytesLike;
          purchaseId: string;
          approval: boolean;
          account: string;
          loyaltyType: LoyaltyType;
          paidPoint: BigNumber;
          paidToken: BigNumber;
          paidValue: BigNumber;
          feePoint: BigNumber;
          feeToken: BigNumber;
          feeValue: BigNumber;
          totalPoint: BigNumber;
          totalToken: BigNumber;
          totalValue: BigNumber;
      }
    | {
          key: NormalSteps.DENIED;
          paymentId: BytesLike;
          purchaseId: string;
          approval: boolean;
          account: string;
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
    | { key: DepositSteps.UPDATING_ALLOWANCE; txHash: BytesLike }
    | { key: DepositSteps.UPDATED_ALLOWANCE; allowance: BigNumber };

export type DepositStepValue =
    | UpdateAllowanceStepValue
    | { key: DepositSteps.DEPOSITING; txHash: BytesLike }
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
    | { key: WithdrawSteps.WITHDRAWING; txHash: BytesLike }
    | { key: WithdrawSteps.DONE; amount: BigNumber };

export type ChangeLoyaltyTypeStepValue =
    | {
          key: NormalSteps.PREPARED;
          account: string;
          signature: BytesLike;
      }
    | { key: NormalSteps.SENT; txHash: BytesLike }
    | {
          key: NormalSteps.DONE;
          account: string;
          amountToken: BigNumberish;
          amountPoint: BigNumberish;
          balanceToken: BigNumberish;
      };

export type ChangeToPayablePointStepValue =
    | {
          key: NormalSteps.PREPARED;
          phone: string;
          phoneHash: BytesLike;
          account: string;
          signature: BytesLike;
          balance: BigNumberish;
      }
    | { key: NormalSteps.SENT; txHash: BytesLike }
    | { key: NormalSteps.DONE };

export type AddShopStepValue =
    | {
          key: NormalSteps.PREPARED;
          shopId: BytesLike;
          name: string;
          currency: string;
          account: string;
          signature: BytesLike;
      }
    | {
          key: NormalSteps.SENT;
          shopId: BytesLike;
          name: string;
          currency: string;
          account: string;
          txHash: BytesLike;
      }
    | {
          key: NormalSteps.DONE;
          shopId: BytesLike;
          name: string;
          currency: string;
          account: string;
      };

export type ApproveShopStepValue =
    | {
          key: NormalSteps.PREPARED;
          taskId: BytesLike;
          shopId: BytesLike;
          approval: boolean;
          account: string;
          signature: BytesLike;
      }
    | {
          key: NormalSteps.SENT;
          taskId: BytesLike;
          shopId: BytesLike;
          approval: boolean;
          account: string;
          txHash: BytesLike;
      }
    | {
          key: NormalSteps.APPROVED;
          taskId: BytesLike;
          shopId: BytesLike;
          approval: boolean;
          account: string;
          name?: string;
          currency?: string;
          status?: ShopStatus;
      }
    | {
          key: NormalSteps.DENIED;
          taskId: BytesLike;
          shopId: BytesLike;
          approval: boolean;
          account: string;
      };

export type OpenWithdrawalShopStepValue =
    | {
          key: NormalSteps.PREPARED;
          shopId: BytesLike;
          amount: BigNumberish;
          account: string;
          signature: BytesLike;
      }
    | { key: NormalSteps.SENT; txHash: BytesLike; shopId: BytesLike }
    | { key: NormalSteps.DONE; shopId: BytesLike; amount: BigNumberish; account: string };

export type CloseWithdrawalShopStepValue =
    | {
          key: NormalSteps.PREPARED;
          shopId: BytesLike;
          account: string;
          signature: BytesLike;
      }
    | { key: NormalSteps.SENT; txHash: BytesLike; shopId: BytesLike }
    | { key: NormalSteps.DONE; shopId: BytesLike; amount: BigNumberish; account: string };

export enum LoyaltyType {
    POINT,
    TOKEN
}

export interface LoyaltyPaymentEvent {
    paymentId: BytesLike;
    purchaseId: string;
    currency: string;
    shopId: BytesLike;
    account: string;
    timestamp: BigNumber;
    loyaltyType: number;
    paidPoint: BigNumber;
    paidToken: BigNumber;
    paidValue: BigNumber;
    feePoint: BigNumber;
    feeToken: BigNumber;
    feeValue: BigNumber;
    totalPoint: BigNumber;
    totalToken: BigNumber;
    totalValue: BigNumber;
}

export interface ShopUpdateEvent {
    shopId: BytesLike;
    name: string;
    currency: string;
    account: string;
    status: ShopStatus;
}

export interface ShopStatusEvent {
    shopId: BytesLike;
    status: ShopStatus;
}

export enum ShopStatus {
    INVALID,
    ACTIVE,
    INACTIVE
}

export enum ShopWithdrawStatus {
    CLOSE,
    OPEN
}

export type ShopData = {
    shopId: BytesLike;
    name: string;
    account: string; // 상점주의 지갑주소
    providedAmount: BigNumber; // 제공된 포인트 총량
    usedAmount: BigNumber; // 사용된 포인트 총량
    settledAmount: BigNumber; // 정산된 포인트 총량
    withdrawnAmount: BigNumber; // 정산된 포인트 총량
    status: ShopStatus;
    withdrawAmount: BigNumber;
    withdrawStatus: ShopWithdrawStatus;
};

export type ValidatorInfoValue = {
    address: string;
    index: number;
    endpoint: string;
    status: number;
};

export enum PhoneLinkRequestStatus {
    INVALID,
    REQUESTED,
    ACCEPTED
}

export enum PhoneLinkRegisterSteps {
    SENDING = "sending",
    REQUESTED = "requested",
    TIMEOUT = "timeout"
}

export type PhoneLinkRegisterStepValue =
    | { key: PhoneLinkRegisterSteps.SENDING; requestId: BytesLike; phone: string; address: string }
    | {
          key: PhoneLinkRegisterSteps.REQUESTED;
          requestId: BytesLike;
          phone: string;
          address: string;
      }
    | {
          key: PhoneLinkRegisterSteps.TIMEOUT;
          requestId: BytesLike;
          phone: string;
          address: string;
      };

export enum PhoneLinkSubmitSteps {
    SENDING = "sending",
    ACCEPTED = "accepted",
    TIMEOUT = "timeout"
}

export type PhoneLinkSubmitStepValue =
    | { key: PhoneLinkSubmitSteps.SENDING; requestId: BytesLike; code: string }
    | {
          key: PhoneLinkSubmitSteps.ACCEPTED;
          requestId: BytesLike;
      }
    | {
          key: PhoneLinkSubmitSteps.TIMEOUT;
          requestId: BytesLike;
      };

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

export enum LedgerPageType {
    NONE = 0,
    SAVE_USE = 1,
    DEPOSIT_WITHDRAW = 2
}

export enum LedgerAction {
    NONE = 0,
    SAVED = 1,
    USED = 2,
    DEPOSITED = 11,
    WITHDRAWN = 12,
    CHANGED = 21,
    SETTLEMENT = 31
}

export enum ShopPageType {
    NONE = 0,
    PROVIDE_USE = 1,
    SETTLEMENT = 2,
    WITHDRAW = 3
}

export enum ShopAction {
    NONE = 0,
    PROVIDED = 1,
    USED = 2,
    SETTLED = 3,
    OPEN_WITHDRAWN = 11,
    CLOSE_WITHDRAWN = 12
}

export enum MobileType {
    USER_APP,
    SHOP_APP
}
