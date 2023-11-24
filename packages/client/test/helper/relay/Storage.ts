import { LoyaltyPaymentTaskData, LoyaltyPaymentTaskStatus, ShopTaskData, ShopTaskStatus } from "./Types";
import { BigNumber } from "@ethersproject/bignumber";
export class Storage {
    private payments: Map<string, LoyaltyPaymentTaskData>;
    private tasks: Map<string, ShopTaskData>;

    constructor() {
        this.payments = new Map<string, LoyaltyPaymentTaskData>();
        this.tasks = new Map<string, ShopTaskData>();
    }

    public async postPayment(payment: LoyaltyPaymentTaskData) {
        const item = this.payments.get(payment.paymentId);
        if (item !== undefined) {
            item.purchaseId = payment.purchaseId;
            item.amount = BigNumber.from(payment.amount);
            item.currency = payment.currency;
            item.shopId = payment.shopId;
            item.account = payment.account;
            item.loyaltyType = payment.loyaltyType;
            item.paidPoint = BigNumber.from(payment.paidPoint);
            item.paidToken = BigNumber.from(payment.paidToken);
            item.paidValue = BigNumber.from(payment.paidValue);
            item.feePoint = BigNumber.from(payment.feePoint);
            item.feeToken = BigNumber.from(payment.feeToken);
            item.feeValue = BigNumber.from(payment.feeValue);
            item.totalPoint = BigNumber.from(payment.totalPoint);
            item.totalToken = BigNumber.from(payment.totalToken);
            item.totalValue = BigNumber.from(payment.totalValue);
            item.paymentStatus = payment.paymentStatus;
            item.openNewTimestamp = payment.openNewTimestamp;
            item.closeNewTimestamp = payment.closeNewTimestamp;
            item.openCancelTimestamp = payment.openCancelTimestamp;
            item.closeCancelTimestamp = payment.closeCancelTimestamp;
        } else {
            this.payments.set(payment.paymentId, payment);
        }
    }

    public async getPayment(id: string): Promise<LoyaltyPaymentTaskData | undefined> {
        return this.payments.get(id);
    }

    public async updatePaymentStatus(id: string, paymentStatus: LoyaltyPaymentTaskStatus): Promise<void> {
        const item = this.payments.get(id);
        if (item !== undefined) {
            item.paymentStatus = paymentStatus;
        }
    }

    public async updatePayment(payment: LoyaltyPaymentTaskData): Promise<void> {
        const item = this.payments.get(payment.paymentId);
        if (item !== undefined) {
            item.purchaseId = payment.purchaseId;
            item.amount = BigNumber.from(payment.amount);
            item.currency = payment.currency;
            item.shopId = payment.shopId;
            item.account = payment.account;
            item.loyaltyType = payment.loyaltyType;
            item.paidPoint = BigNumber.from(payment.paidPoint);
            item.paidToken = BigNumber.from(payment.paidToken);
            item.paidValue = BigNumber.from(payment.paidValue);
            item.feePoint = BigNumber.from(payment.feePoint);
            item.feeToken = BigNumber.from(payment.feeToken);
            item.feeValue = BigNumber.from(payment.feeValue);
            item.totalPoint = BigNumber.from(payment.totalPoint);
            item.totalToken = BigNumber.from(payment.totalToken);
            item.totalValue = BigNumber.from(payment.totalValue);
            item.paymentStatus = payment.paymentStatus;
            item.openNewTimestamp = payment.openNewTimestamp;
            item.closeNewTimestamp = payment.closeNewTimestamp;
            item.openCancelTimestamp = payment.openCancelTimestamp;
            item.closeCancelTimestamp = payment.closeCancelTimestamp;
        }
    }

    public async updateOpenCancelTimestamp(id: string, value: number): Promise<void> {
        const item = this.payments.get(id);
        if (item !== undefined) {
            item.openCancelTimestamp = value;
        }
    }

    public async postTask(task: ShopTaskData): Promise<void> {
        const item = this.tasks.get(task.taskId);
        if (item !== undefined) {
            item.type = task.type;
            item.shopId = task.shopId;
            item.name = task.name;
            item.provideWaitTime = task.provideWaitTime;
            item.providePercent = task.providePercent;
            item.status = task.status;
            item.account = task.account;
            item.taskStatus = task.taskStatus;
            item.timestamp = task.timestamp;
        } else {
            this.tasks.set(task.taskId, task);
        }
    }

    public async getTask(id: string): Promise<ShopTaskData | undefined> {
        return this.tasks.get(id);
    }

    public async updateTaskStatus(id: string, taskStatus: ShopTaskStatus): Promise<void> {
        const item = this.tasks.get(id);
        if (item !== undefined) {
            item.taskStatus = taskStatus;
        }
    }

    public async updateTask(task: ShopTaskData): Promise<void> {
        const item = this.tasks.get(task.taskId);
        if (item !== undefined) {
            item.type = task.type;
            item.shopId = task.shopId;
            item.name = task.name;
            item.provideWaitTime = task.provideWaitTime;
            item.providePercent = task.providePercent;
            item.status = task.status;
            item.account = task.account;
            item.taskStatus = task.taskStatus;
            item.timestamp = task.timestamp;
        }
    }
}
