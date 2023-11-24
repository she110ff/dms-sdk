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
    NULL,
    OPENED_NEW,
    CONFIRMED_NEW,
    DENIED_NEW,
    REPLY_COMPLETED_NEW,
    CLOSED_NEW,
    FAILED_NEW,
    OPENED_CANCEL,
    CONFIRMED_CANCEL,
    DENIED_CANCEL,
    REPLY_COMPLETED_CANCEL,
    CLOSED_CANCEL,
    FAILED_CANCEL,
    TIMEOUT
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
    NULL,
    OPENED,
    CONFIRMED,
    DENIED,
    COMPLETED,
    TIMEOUT
}

export interface ShopDetailData {
    taskId: BytesLike;
    shopId: BytesLike;
    name: string;
    provideWaitTime: number;
    providePercent: number;
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
          balance: BigNumber;
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
          balance: BigNumber;
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
          account: string;
          signature: BytesLike;
      }
    | {
          key: NormalSteps.SENT;
          shopId: BytesLike;
          name: string;
          account: string;
          txHash: BytesLike;
      }
    | {
          key: NormalSteps.DONE;
          shopId: BytesLike;
          name: string;
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
          provideWaitTime?: number;
          providePercent?: number;
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
    status: number;
    balance: BigNumber;
}

export interface ShopUpdateEvent {
    shopId: BytesLike;
    name: string;
    provideWaitTime: number;
    providePercent: number;
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
    provideWaitTime: number; // 제품구매 후 포인트 지급시간
    providePercent: number; // 구매금액에 대한 포인트 지급량
    account: string; // 상점주의 지갑주소
    providedPoint: BigNumber; // 제공된 포인트 총량
    usedPoint: BigNumber; // 사용된 포인트 총량
    settledPoint: BigNumber; // 정산된 포인트 총량
    withdrawnPoint: BigNumber; // 정산된 포인트 총량
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
