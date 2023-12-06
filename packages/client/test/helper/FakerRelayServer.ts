/*******************************************************************************

 Includes fake agora, stoa and sample data needed for testing.

 Copyright:
 Copyright (c) 2020-2021 BOSAGORA Foundation
 All rights reserved.

 License:
 MIT License. See LICENSE for details.

 *******************************************************************************/

// tslint:disable-next-line:no-implicit-dependencies
import * as bodyParser from "body-parser";
// @ts-ignore
import cors from "cors";
import * as http from "http";
// @ts-ignore
import e, * as express from "express";
import { body, query, validationResult } from "express-validator";

import { ContractUtils, findLog } from "../../src";
import { AccountIndex, GanacheServer } from "./GanacheServer";
import { Deployment } from "./ContractDeployer";
import { Utils } from "./Utils";

import {
    CurrencyRate__factory,
    CurrencyRate,
    Ledger,
    Ledger__factory,
    ShopCollection,
    ShopCollection__factory,
    Token,
    Token__factory
} from "dms-osx-lib";

import { NonceManager } from "@ethersproject/experimental";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber, ContractTransaction } from "ethers";

import { GasPriceManager } from "./relay/GasPriceManager";

import {
    ContractLoyaltyPaymentEvent,
    ContractLoyaltyPaymentStatus,
    ContractLoyaltyType,
    ContractShopStatus,
    ContractShopUpdateEvent,
    ContractShopStatusEvent,
    LoyaltyPaymentTaskData,
    LoyaltyPaymentTaskStatus,
    ShopTaskData,
    ShopTaskStatus,
    TaskResultType
} from "./relay/Types";
import { ResponseMessage } from "./relay/Errors";
import { Storage } from "./relay/Storage";

/**
 * This is an Agora node for testing.
 * The test code allows the Agora node to be started and shut down.
 */
export class FakerRelayServer {
    /**
     * The application of express module
     */
    protected app: express.Application;
    /**
     * The Http server
     */
    protected server: http.Server | null = null;
    protected deployment: Deployment;
    /**
     * The bind port
     */
    private readonly port: number;

    private readonly _accounts: Signer[];

    public static PAYMENT_TIMEOUT_SECONDS = 60;
    public static ACCESS_KEY = "12345678";

    private _storage: Storage;

    /**
     * Constructor
     * @param port The bind port
     * @param deployment The deployment contracts
     */
    constructor(port: number | string, deployment: Deployment) {
        if (typeof port === "string") this.port = parseInt(port, 10);
        else this.port = port;

        this.app = e();
        this.deployment = deployment;
        this._accounts = GanacheServer.accounts();
        this._storage = new Storage();
    }

    /**
     * Start the web server
     */
    public start(): Promise<void> {
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());
        this.app.use(
            cors({
                allowedHeaders: "*",
                credentials: true,
                methods: "GET, POST",
                origin: "*",
                preflightContinue: false
            })
        );

        this.app.get("/", [], this.getHealthStatus.bind(this));

        this.app.post(
            "/v1/payment/new/open",
            [
                body("accessKey").exists(),
                body("purchaseId").exists(),
                body("amount")
                    .exists()
                    .custom(Utils.isAmount),
                body("currency").exists(),
                body("shopId")
                    .exists()
                    .trim()
                    .matches(/^(0x)[0-9a-f]{64}$/i),
                body("account")
                    .exists()
                    .trim()
                    .isEthereumAddress()
            ],
            this.payment_new_open.bind(this)
        );

        this.app.post(
            "/v1/payment/new/close",
            [
                body("accessKey").exists(),
                body("confirm")
                    .exists()
                    .trim()
                    .toLowerCase()
                    .isIn(["true", "false"]),
                body("paymentId").exists()
            ],
            this.payment_new_close.bind(this)
        );

        this.app.post(
            "/v1/payment/new/approval",
            [
                body("paymentId").exists(),
                body("approval")
                    .exists()
                    .trim()
                    .toLowerCase()
                    .isIn(["true", "false"]),
                body("signature")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.payment_new_approval.bind(this)
        );

        this.app.get("/v1/payment/item", [query("paymentId").exists()], this.payment_item.bind(this));

        this.app.post(
            "/v1/payment/cancel/open",
            [body("accessKey").exists(), body("paymentId").exists()],
            this.payment_cancel_open.bind(this)
        );

        this.app.post(
            "/v1/payment/cancel/close",
            [
                body("accessKey").exists(),
                body("confirm")
                    .exists()
                    .trim()
                    .toLowerCase()
                    .isIn(["true", "false"]),
                body("paymentId").exists()
            ],
            this.payment_cancel_close.bind(this)
        );

        this.app.post(
            "/v1/payment/cancel/approval",
            [
                body("paymentId").exists(),
                body("approval")
                    .exists()
                    .trim()
                    .toLowerCase()
                    .isIn(["true", "false"]),
                body("signature")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.payment_cancel_approval.bind(this)
        );

        this.app.post(
            "/v1/ledger/changeToLoyaltyToken",
            [
                body("account")
                    .exists()
                    .isEthereumAddress(),
                body("signature")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.changeToLoyaltyToken.bind(this)
        );

        this.app.post(
            "/v1/ledger/changeToPayablePoint",
            [
                body("phone")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{64}$/i),
                body("account")
                    .exists()
                    .isEthereumAddress(),
                body("signature")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.changeToPayablePoint.bind(this)
        );

        this.app.post(
            "/v1/shop/add",
            [
                body("shopId")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{64}$/i),
                body("name").exists(),
                body("currency").exists(),
                body("account")
                    .exists()
                    .trim()
                    .isEthereumAddress(),
                body("signature")
                    .exists()
                    .trim()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.shop_add.bind(this)
        );
        this.app.get("/v1/shop/task", [query("taskId").exists()], this.shop_task.bind(this));
        this.app.post(
            "/v1/shop/update/create",
            [
                body("accessKey").exists(),
                body("shopId")
                    .exists()
                    .trim()
                    .matches(/^(0x)[0-9a-f]{64}$/i),
                body("name").exists(),
                body("currency").exists(),
                body("provideWaitTime")
                    .exists()
                    .custom(Utils.isAmount),
                body("providePercent")
                    .exists()
                    .custom(Utils.isAmount)
            ],
            this.shop_update_create.bind(this)
        );
        this.app.post(
            "/v1/shop/update/approval",
            [
                body("taskId").exists(),
                body("approval")
                    .exists()
                    .trim()
                    .toLowerCase()
                    .isIn(["true", "false"]),
                body("signature")
                    .exists()
                    .trim()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.shop_update_approval.bind(this)
        );
        this.app.post(
            "/v1/shop/status/create",
            [
                body("accessKey").exists(),
                body("shopId")
                    .exists()
                    .trim()
                    .matches(/^(0x)[0-9a-f]{64}$/i),
                body("status")
                    .exists()
                    .trim()
                    .isIn(["1", "2"])
            ],
            this.shop_status_create.bind(this)
        );
        this.app.post(
            "/v1/shop/status/approval",
            [
                body("taskId").exists(),
                body("approval")
                    .exists()
                    .trim()
                    .toLowerCase()
                    .isIn(["true", "false"]),
                body("signature")
                    .exists()
                    .trim()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.shop_status_approval.bind(this)
        );

        this.app.post(
            "/v1/shop/withdrawal/open",
            [
                body("shopId")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{64}$/i),
                body("amount")
                    .exists()
                    .custom(Utils.isAmount),
                body("account")
                    .exists()
                    .isEthereumAddress(),
                body("signature")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.shop_withdrawal_open.bind(this)
        );

        this.app.post(
            "/v1/shop/withdrawal/close",
            [
                body("shopId")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{64}$/i),
                body("account")
                    .exists()
                    .isEthereumAddress(),
                body("signature")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.shop_withdrawal_close.bind(this)
        );

        // 포인트의 종류를 선택하는 기능
        this.app.post(
            "/v1/mobile/register",
            [
                body("account")
                    .exists()
                    .trim()
                    .isEthereumAddress(),
                body("token").exists(),
                body("language").exists(),
                body("os").exists(),
                body("signature")
                    .exists()
                    .trim()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.mobile_register.bind(this)
        );

        // Listen on provided this.port on this.address.
        return new Promise<void>((resolve, reject) => {
            // Create HTTP server.
            this.server = http.createServer(this.app);
            this.server.on("error", reject);
            this.server.listen(this.port, () => {
                resolve();
            });
        });
    }

    public stop(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.server != null)
                this.server.close((err?) => {
                    err === undefined ? resolve() : reject(err);
                });
            else resolve();
        });
    }

    private get ledgerContract(): Ledger {
        return Ledger__factory.connect(this.deployment.ledger.address, this.signer) as Ledger;
    }

    private get shopContract(): ShopCollection {
        return ShopCollection__factory.connect(this.deployment.shopCollection.address, this.signer) as ShopCollection;
    }

    private get tokenContract(): Token {
        return Token__factory.connect(this.deployment.token.address, this.signer) as Token;
    }

    private get currencyRateContract(): CurrencyRate {
        return CurrencyRate__factory.connect(this.deployment.currencyRate.address, this.signer) as CurrencyRate;
    }

    private get signer(): Signer {
        return new NonceManager(new GasPriceManager(this._accounts[AccountIndex.CERTIFIER01]));
    }

    private makeResponseData(code: number, data: any, error?: any): any {
        return {
            code,
            data,
            error
        };
    }

    // @ts-ignore
    private async getHealthStatus(req: express.Request, res: express.Response) {
        return res.status(200).json("OK");
    }

    /**
     * POST /v1/payment/new/open
     * @private
     */
    private async payment_new_open(req: express.Request, res: express.Response) {
        console.log(`POST /v1/payment/new/open`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const accessKey: string = String(req.body.accessKey).trim();
            if (accessKey !== FakerRelayServer.ACCESS_KEY) {
                return res.json(ResponseMessage.getErrorMessage("2002"));
            }

            const purchaseId: string = String(req.body.purchaseId).trim();
            const amount: BigNumber = BigNumber.from(req.body.amount);
            const currency: string = String(req.body.currency).trim();
            const shopId: string = String(req.body.shopId).trim();
            const account: string = String(req.body.account).trim();

            const feeRate = await this.ledgerContract.fee();
            const rate = await this.currencyRateContract.get(currency.toLowerCase());
            const multiple = await this.currencyRateContract.MULTIPLE();

            let balance: BigNumber;
            let paidPoint: BigNumber;
            let paidToken: BigNumber;
            let paidValue: BigNumber;
            let feePoint: BigNumber;
            let feeToken: BigNumber;
            let feeValue: BigNumber;
            let totalPoint: BigNumber;
            let totalToken: BigNumber;
            let totalValue: BigNumber;

            const contract = this.ledgerContract;
            const loyaltyType = await contract.loyaltyTypeOf(account);
            if (loyaltyType === ContractLoyaltyType.POINT) {
                balance = await contract.pointBalanceOf(account);
                paidPoint = amount.mul(rate).div(multiple);
                feePoint = paidPoint.mul(feeRate).div(100);
                totalPoint = paidPoint.add(feePoint);
                if (totalPoint.gt(balance)) {
                    return res.status(200).json(this.makeResponseData(401, null, { message: "Insufficient balance" }));
                }
                paidToken = BigNumber.from(0);
                feeToken = BigNumber.from(0);
                totalToken = BigNumber.from(0);
            } else {
                balance = await contract.tokenBalanceOf(account);
                const symbol = await this.tokenContract.symbol();
                const tokenRate = await this.currencyRateContract.get(symbol);
                paidToken = amount.mul(rate).div(tokenRate);
                feeToken = paidToken.mul(feeRate).div(100);
                totalToken = paidToken.add(feeToken);
                if (totalToken.gt(balance)) {
                    return res.status(200).json(this.makeResponseData(401, null, { message: "Insufficient balance" }));
                }
                paidPoint = BigNumber.from(0);
                feePoint = BigNumber.from(0);
                totalPoint = BigNumber.from(0);
            }
            paidValue = BigNumber.from(amount);
            feeValue = paidValue.mul(feeRate).div(100);
            totalValue = paidValue.add(feeValue);

            const paymentId = await this.getPaymentId(account);
            const item: LoyaltyPaymentTaskData = {
                paymentId,
                purchaseId,
                amount,
                currency,
                shopId,
                account,
                loyaltyType,
                paidPoint,
                paidToken,
                paidValue,
                feePoint,
                feeToken,
                feeValue,
                totalPoint,
                totalToken,
                totalValue,
                paymentStatus: LoyaltyPaymentTaskStatus.OPENED_NEW,
                openNewTimestamp: ContractUtils.getTimeStamp(),
                closeNewTimestamp: 0,
                openCancelTimestamp: 0,
                closeCancelTimestamp: 0
            };
            await this._storage.postPayment(item);

            res.status(200).json(
                this.makeResponseData(0, {
                    paymentId: item.paymentId,
                    purchaseId: item.purchaseId,
                    amount: item.amount.toString(),
                    currency: item.currency,
                    shopId: item.shopId,
                    account: item.account,
                    loyaltyType: item.loyaltyType,
                    paidPoint: item.paidPoint.toString(),
                    paidToken: item.paidToken.toString(),
                    paidValue: item.paidValue.toString(),
                    feePoint: item.feePoint.toString(),
                    feeToken: item.feeToken.toString(),
                    feeValue: item.feeValue.toString(),
                    totalPoint: item.totalPoint.toString(),
                    totalToken: item.totalToken.toString(),
                    totalValue: item.totalValue.toString(),
                    paymentStatus: item.paymentStatus,
                    openNewTimestamp: item.openNewTimestamp,
                    closeNewTimestamp: item.closeNewTimestamp,
                    openCancelTimestamp: item.openCancelTimestamp,
                    closeCancelTimestamp: item.closeCancelTimestamp
                })
            );

            return;
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`GET /v1/payment/new/open : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * POST /v1/payment/new/approval
     * @private
     */
    private async payment_new_approval(req: express.Request, res: express.Response) {
        console.log(`POST /v1/payment/new/approval`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const paymentId: string = String(req.body.paymentId).trim();
            const approval: boolean =
                String(req.body.approval)
                    .trim()
                    .toLowerCase() === "true";
            const signature: string = String(req.body.signature).trim();

            const item = await this._storage.getPayment(paymentId);
            if (item === undefined) {
                return res.status(200).json(ResponseMessage.getErrorMessage("2003"));
            } else {
                if (item.paymentStatus !== LoyaltyPaymentTaskStatus.OPENED_NEW) {
                    return res.status(200).json(ResponseMessage.getErrorMessage("2020"));
                }

                if (
                    !ContractUtils.verifyLoyaltyNewPayment(
                        item.paymentId,
                        item.purchaseId,
                        item.amount,
                        item.currency,
                        item.shopId,
                        await this.ledgerContract.nonceOf(item.account),
                        item.account,
                        signature
                    )
                ) {
                    return res.status(200).json(ResponseMessage.getErrorMessage("1501"));
                }

                if (ContractUtils.getTimeStamp() - item.openNewTimestamp > FakerRelayServer.PAYMENT_TIMEOUT_SECONDS) {
                    item.paymentStatus = LoyaltyPaymentTaskStatus.TIMEOUT;
                    await this._storage.updatePaymentStatus(item.paymentId, item.paymentStatus);
                    const data = ResponseMessage.getErrorMessage("7000");
                    return res.status(200).json(data);
                }
                const contract = this.ledgerContract;
                const loyaltyPaymentData = await contract.loyaltyPaymentOf(paymentId);
                if (approval) {
                    if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.INVALID) {
                        try {
                            const tx = await contract.openNewLoyaltyPayment({
                                paymentId: item.paymentId,
                                purchaseId: item.purchaseId,
                                amount: item.amount,
                                currency: item.currency.toLowerCase(),
                                shopId: item.shopId,
                                account: item.account,
                                signature
                            });

                            const event = await this.waitPaymentLoyalty(contract, tx);
                            if (event !== undefined) {
                                item.paymentStatus = LoyaltyPaymentTaskStatus.REPLY_COMPLETED_NEW;
                                this.updateEvent(event, item);
                                await this._storage.updatePayment(item);

                                return res.status(200).json(
                                    this.makeResponseData(0, {
                                        paymentId: item.paymentId,
                                        purchaseId: item.purchaseId,
                                        amount: item.amount.toString(),
                                        currency: item.currency,
                                        shopId: item.shopId,
                                        account: item.account,
                                        paymentStatus: item.paymentStatus,
                                        txHash: tx.hash
                                    })
                                );
                            } else {
                                return res.status(200).json(ResponseMessage.getErrorMessage("5000"));
                            }
                        } catch (error) {
                            const msg = ResponseMessage.getEVMErrorMessage(error);
                            console.log(`POST /v1/payment/new/approval : ${msg.error.message}`);
                            return res.status(200).json(msg);
                        }
                    } else if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.OPENED_PAYMENT) {
                        item.paymentStatus = LoyaltyPaymentTaskStatus.REPLY_COMPLETED_NEW;
                        await this._storage.updatePayment(item);
                        return res.status(200).json(ResponseMessage.getErrorMessage("2025"));
                    } else if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.CLOSED_PAYMENT) {
                        item.paymentStatus = LoyaltyPaymentTaskStatus.CLOSED_NEW;
                        await this._storage.updatePayment(item);
                        return res.status(200).json(ResponseMessage.getErrorMessage("2026"));
                    } else if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.FAILED_PAYMENT) {
                        item.paymentStatus = LoyaltyPaymentTaskStatus.FAILED_NEW;
                        await this._storage.updatePayment(item);
                        return res.status(200).json(ResponseMessage.getErrorMessage("2027"));
                    } else {
                        return res.status(200).json(ResponseMessage.getErrorMessage("2020"));
                    }
                } else {
                    if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.INVALID) {
                        item.paymentStatus = LoyaltyPaymentTaskStatus.DENIED_NEW;
                        await this._storage.updatePaymentStatus(item.paymentId, item.paymentStatus);

                        return res.status(200).json(
                            this.makeResponseData(0, {
                                paymentId: item.paymentId,
                                purchaseId: item.purchaseId,
                                amount: item.amount.toString(),
                                currency: item.currency,
                                shopId: item.shopId,
                                account: item.account,
                                paymentStatus: item.paymentStatus
                            })
                        );
                    } else {
                        return res.status(200).json(ResponseMessage.getErrorMessage("2028"));
                    }
                }
            }
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/payment/new/approval : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * POST /v1/payment/new/close
     * @private
     */
    private async payment_new_close(req: express.Request, res: express.Response) {
        console.log(`POST /v1/payment/new/close`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const accessKey: string = String(req.body.accessKey).trim();
            if (accessKey !== FakerRelayServer.ACCESS_KEY) {
                return res.json(ResponseMessage.getErrorMessage("2002"));
            }

            const confirm: boolean =
                String(req.body.confirm)
                    .trim()
                    .toLowerCase() === "true";
            const paymentId: string = String(req.body.paymentId).trim();
            const item = await this._storage.getPayment(paymentId);
            if (item === undefined) {
                return res.status(200).json(ResponseMessage.getErrorMessage("2003"));
            } else {
                const contract = this.ledgerContract;
                const loyaltyPaymentData = await contract.loyaltyPaymentOf(paymentId);
                if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.INVALID) {
                    if (item.paymentStatus === LoyaltyPaymentTaskStatus.DENIED_NEW) {
                        item.paymentStatus = LoyaltyPaymentTaskStatus.FAILED_NEW;
                        item.closeNewTimestamp = ContractUtils.getTimeStamp();
                        await this._storage.updatePayment(item);

                        return res.status(200).json(
                            this.makeResponseData(0, {
                                paymentId: item.paymentId,
                                purchaseId: item.purchaseId,
                                amount: item.amount.toString(),
                                currency: item.currency,
                                shopId: item.shopId,
                                account: item.account,
                                loyaltyType: item.loyaltyType,
                                paidPoint: item.paidPoint.toString(),
                                paidToken: item.paidToken.toString(),
                                paidValue: item.paidValue.toString(),
                                feePoint: item.feePoint.toString(),
                                feeToken: item.feeToken.toString(),
                                feeValue: item.feeValue.toString(),
                                totalPoint: item.totalPoint.toString(),
                                totalToken: item.totalToken.toString(),
                                totalValue: item.totalValue.toString(),
                                paymentStatus: item.paymentStatus,
                                openNewTimestamp: item.openNewTimestamp,
                                closeNewTimestamp: item.closeNewTimestamp,
                                openCancelTimestamp: item.openCancelTimestamp,
                                closeCancelTimestamp: item.closeCancelTimestamp
                            })
                        );
                    } else if (
                        item.paymentStatus === LoyaltyPaymentTaskStatus.OPENED_NEW ||
                        item.paymentStatus === LoyaltyPaymentTaskStatus.APPROVED_NEW_FAILED_TX ||
                        item.paymentStatus === LoyaltyPaymentTaskStatus.APPROVED_NEW_SENT_TX ||
                        item.paymentStatus === LoyaltyPaymentTaskStatus.APPROVED_NEW_CONFIRMED_TX ||
                        item.paymentStatus === LoyaltyPaymentTaskStatus.APPROVED_NEW_REVERTED_TX
                    ) {
                        const timeout = FakerRelayServer.PAYMENT_TIMEOUT_SECONDS - 5;
                        if (ContractUtils.getTimeStamp() - item.openNewTimestamp > timeout) {
                            item.paymentStatus = LoyaltyPaymentTaskStatus.FAILED_NEW;
                            item.closeNewTimestamp = ContractUtils.getTimeStamp();
                            await this._storage.updatePayment(item);
                            return res.status(200).json(
                                this.makeResponseData(0, {
                                    paymentId: item.paymentId,
                                    purchaseId: item.purchaseId,
                                    amount: item.amount.toString(),
                                    currency: item.currency,
                                    shopId: item.shopId,
                                    account: item.account,
                                    loyaltyType: item.loyaltyType,
                                    paidPoint: item.paidPoint.toString(),
                                    paidToken: item.paidToken.toString(),
                                    paidValue: item.paidValue.toString(),
                                    feePoint: item.feePoint.toString(),
                                    feeToken: item.feeToken.toString(),
                                    feeValue: item.feeValue.toString(),
                                    totalPoint: item.totalPoint.toString(),
                                    totalToken: item.totalToken.toString(),
                                    totalValue: item.totalValue.toString(),
                                    paymentStatus: item.paymentStatus,
                                    openNewTimestamp: item.openNewTimestamp,
                                    closeNewTimestamp: item.closeNewTimestamp,
                                    openCancelTimestamp: item.openCancelTimestamp,
                                    closeCancelTimestamp: item.closeCancelTimestamp
                                })
                            );
                        } else {
                            return res.status(200).json(ResponseMessage.getErrorMessage("2030"));
                        }
                    } else if (
                        item.paymentStatus === LoyaltyPaymentTaskStatus.CLOSED_NEW ||
                        item.paymentStatus === LoyaltyPaymentTaskStatus.FAILED_NEW
                    ) {
                        item.paymentStatus = LoyaltyPaymentTaskStatus.FAILED_NEW;
                        item.closeNewTimestamp = ContractUtils.getTimeStamp();
                        await this._storage.updatePayment(item);
                        return res.status(200).json(ResponseMessage.getErrorMessage("2029"));
                    } else {
                        return res.status(200).json(ResponseMessage.getErrorMessage("2024"));
                    }
                } else if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.OPENED_PAYMENT) {
                    try {
                        const tx = await contract.closeNewLoyaltyPayment(item.paymentId, confirm);

                        const event = await this.waitPaymentLoyalty(contract, tx);
                        if (event !== undefined) {
                            item.paymentStatus = confirm
                                ? LoyaltyPaymentTaskStatus.CLOSED_NEW
                                : LoyaltyPaymentTaskStatus.FAILED_NEW;
                            item.closeNewTimestamp = ContractUtils.getTimeStamp();
                            this.updateEvent(event, item);
                            await this._storage.updatePayment(item);

                            return res.status(200).json(
                                this.makeResponseData(0, {
                                    paymentId: item.paymentId,
                                    purchaseId: item.purchaseId,
                                    amount: item.amount.toString(),
                                    currency: item.currency,
                                    shopId: item.shopId,
                                    account: item.account,
                                    loyaltyType: item.loyaltyType,
                                    paidPoint: item.paidPoint.toString(),
                                    paidToken: item.paidToken.toString(),
                                    paidValue: item.paidValue.toString(),
                                    feePoint: item.feePoint.toString(),
                                    feeToken: item.feeToken.toString(),
                                    feeValue: item.feeValue.toString(),
                                    totalPoint: item.totalPoint.toString(),
                                    totalToken: item.totalToken.toString(),
                                    totalValue: item.totalValue.toString(),
                                    paymentStatus: item.paymentStatus,
                                    openNewTimestamp: item.openNewTimestamp,
                                    closeNewTimestamp: item.closeNewTimestamp,
                                    openCancelTimestamp: item.openCancelTimestamp,
                                    closeCancelTimestamp: item.closeCancelTimestamp
                                })
                            );
                        } else {
                            return res.status(200).json(ResponseMessage.getErrorMessage("5000"));
                        }
                    } catch (error) {
                        const msg = ResponseMessage.getEVMErrorMessage(error);
                        console.log(`POST /v1/payment/new/close : ${msg.error.message}`);
                        return res.status(200).json(this.makeResponseData(msg.code, undefined, msg.error));
                    }
                } else if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.CLOSED_PAYMENT) {
                    item.paymentStatus = LoyaltyPaymentTaskStatus.CLOSED_NEW;
                    item.closeNewTimestamp = ContractUtils.getTimeStamp();
                    await this._storage.updatePaymentStatus(item.paymentId, item.paymentStatus);
                    return res.status(200).json(ResponseMessage.getErrorMessage("2026"));
                } else if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.FAILED_PAYMENT) {
                    item.paymentStatus = LoyaltyPaymentTaskStatus.FAILED_NEW;
                    item.closeNewTimestamp = ContractUtils.getTimeStamp();
                    await this._storage.updatePaymentStatus(item.paymentId, item.paymentStatus);
                    return res.status(200).json(ResponseMessage.getErrorMessage("2026"));
                } else {
                    item.paymentStatus = LoyaltyPaymentTaskStatus.CLOSED_NEW;
                    item.closeNewTimestamp = ContractUtils.getTimeStamp();
                    await this._storage.updatePaymentStatus(item.paymentId, item.paymentStatus);
                    return res.status(200).json(ResponseMessage.getErrorMessage("2026"));
                }
            }
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/payment/new/close : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * GET /v1/payment/item
     * @private
     */
    private async payment_item(req: express.Request, res: express.Response) {
        console.log(`GET /v1/payment/item`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const paymentId: string = String(req.query.paymentId).trim();
            const item = await this._storage.getPayment(paymentId);
            if (item === undefined) {
                return res.status(200).json(ResponseMessage.getErrorMessage("2003"));
            }
            return res.status(200).json(
                this.makeResponseData(0, {
                    paymentId: item.paymentId,
                    purchaseId: item.purchaseId,
                    amount: item.amount.toString(),
                    currency: item.currency,
                    shopId: item.shopId,
                    account: item.account,
                    loyaltyType: item.loyaltyType,
                    paidPoint: item.paidPoint.toString(),
                    paidToken: item.paidToken.toString(),
                    paidValue: item.paidValue.toString(),
                    feePoint: item.feePoint.toString(),
                    feeToken: item.feeToken.toString(),
                    feeValue: item.feeValue.toString(),
                    totalPoint: item.totalPoint.toString(),
                    totalToken: item.totalToken.toString(),
                    totalValue: item.totalValue.toString(),
                    paymentStatus: item.paymentStatus,
                    openNewTimestamp: item.openNewTimestamp,
                    closeNewTimestamp: item.closeNewTimestamp,
                    openCancelTimestamp: item.openCancelTimestamp,
                    closeCancelTimestamp: item.closeCancelTimestamp
                })
            );
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`GET /v1/payment/item : ${msg.error.message}`);
            return res.status(200).json(this.makeResponseData(msg.code, undefined, msg.error));
        }
    }

    /**
     * 결제 / 결제정보를 제공한다
     * POST /v1/payment/cancel/open
     * @private
     */
    private async payment_cancel_open(req: express.Request, res: express.Response) {
        console.log(`POST /v1/payment/cancel/open`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const accessKey: string = String(req.body.accessKey).trim();
            if (accessKey !== FakerRelayServer.ACCESS_KEY) {
                return res.json(ResponseMessage.getErrorMessage("2002"));
            }

            const paymentId: string = String(req.body.paymentId).trim();
            const item = await this._storage.getPayment(paymentId);
            if (item === undefined) {
                return res.status(200).json(ResponseMessage.getErrorMessage("2003"));
            } else {
                if (item.paymentStatus !== LoyaltyPaymentTaskStatus.CLOSED_NEW) {
                    return res.status(200).json(ResponseMessage.getErrorMessage("2022"));
                }

                item.paymentStatus = LoyaltyPaymentTaskStatus.OPENED_CANCEL;
                await this._storage.updatePaymentStatus(item.paymentId, item.paymentStatus);

                item.openCancelTimestamp = ContractUtils.getTimeStamp();
                await this._storage.updateOpenCancelTimestamp(item.paymentId, item.openCancelTimestamp);

                return res.status(200).json(
                    this.makeResponseData(0, {
                        paymentId: item.paymentId,
                        purchaseId: item.purchaseId,
                        amount: item.amount.toString(),
                        currency: item.currency,
                        shopId: item.shopId,
                        account: item.account,
                        loyaltyType: item.loyaltyType,
                        paidPoint: item.paidPoint.toString(),
                        paidToken: item.paidToken.toString(),
                        paidValue: item.paidValue.toString(),
                        feePoint: item.feePoint.toString(),
                        feeToken: item.feeToken.toString(),
                        feeValue: item.feeValue.toString(),
                        totalPoint: item.totalPoint.toString(),
                        totalToken: item.totalToken.toString(),
                        totalValue: item.totalValue.toString(),
                        paymentStatus: item.paymentStatus,
                        openNewTimestamp: item.openNewTimestamp,
                        closeNewTimestamp: item.closeNewTimestamp,
                        openCancelTimestamp: item.openCancelTimestamp,
                        closeCancelTimestamp: item.closeCancelTimestamp
                    })
                );
            }
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/payment/cancel/open : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * POST /v1/payment/cancel/approval
     * @private
     */
    private async payment_cancel_approval(req: express.Request, res: express.Response) {
        console.log(`POST /v1/payment/cancel/approval`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const paymentId: string = String(req.body.paymentId).trim();
            const approval: boolean =
                String(req.body.approval)
                    .trim()
                    .toLowerCase() === "true";
            const signature: string = String(req.body.signature).trim();
            const item = await this._storage.getPayment(paymentId);
            if (item === undefined) {
                return res.status(200).json(ResponseMessage.getErrorMessage("2003"));
            } else {
                if (item.paymentStatus !== LoyaltyPaymentTaskStatus.OPENED_CANCEL) {
                    return res.status(200).json(ResponseMessage.getErrorMessage("2020"));
                }

                const shopContract = await this.shopContract;
                const shopData = await shopContract.shopOf(item.shopId);

                if (
                    !ContractUtils.verifyLoyaltyCancelPayment(
                        item.paymentId,
                        item.purchaseId,
                        await this.ledgerContract.nonceOf(shopData.account),
                        shopData.account,
                        signature
                    )
                ) {
                    return res.status(200).json(ResponseMessage.getErrorMessage("1501"));
                }

                if (
                    ContractUtils.getTimeStamp() - item.openCancelTimestamp >
                    FakerRelayServer.PAYMENT_TIMEOUT_SECONDS
                ) {
                    item.paymentStatus = LoyaltyPaymentTaskStatus.TIMEOUT;
                    await this._storage.updatePaymentStatus(item.paymentId, item.paymentStatus);
                    const msg = ResponseMessage.getErrorMessage("7000");
                    return res.status(200).json(msg);
                }
                const contract = this.ledgerContract;
                const loyaltyPaymentData = await contract.loyaltyPaymentOf(paymentId);
                if (approval) {
                    if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.CLOSED_PAYMENT) {
                        try {
                            const tx = await contract.openCancelLoyaltyPayment(item.paymentId, signature);

                            const event = await this.waitPaymentLoyalty(contract, tx);
                            if (event !== undefined) {
                                item.paymentStatus = LoyaltyPaymentTaskStatus.REPLY_COMPLETED_CANCEL;
                                this.updateEvent(event, item);
                                await this._storage.updatePayment(item);

                                return res.status(200).json(
                                    this.makeResponseData(0, {
                                        paymentId: item.paymentId,
                                        purchaseId: item.purchaseId,
                                        amount: item.amount.toString(),
                                        currency: item.currency,
                                        shopId: item.shopId,
                                        account: item.account,
                                        paymentStatus: item.paymentStatus,
                                        txHash: tx.hash
                                    })
                                );
                            } else {
                                return res.status(200).json(ResponseMessage.getErrorMessage("5000"));
                            }
                        } catch (error) {
                            const msg = ResponseMessage.getEVMErrorMessage(error);
                            console.log(`POST /v1/payment/cancel/approval : ${msg.error.message}`);
                            return res.status(200).json(msg);
                        }
                    } else if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.OPENED_CANCEL) {
                        item.paymentStatus = LoyaltyPaymentTaskStatus.REPLY_COMPLETED_CANCEL;
                        await this._storage.updatePayment(item);
                        return res.status(200).json(ResponseMessage.getErrorMessage("2025"));
                    } else if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.CLOSED_CANCEL) {
                        item.paymentStatus = LoyaltyPaymentTaskStatus.CLOSED_CANCEL;
                        await this._storage.updatePayment(item);
                        return res.status(200).json(ResponseMessage.getErrorMessage("2026"));
                    } else if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.FAILED_CANCEL) {
                        item.paymentStatus = LoyaltyPaymentTaskStatus.FAILED_CANCEL;
                        await this._storage.updatePayment(item);
                        return res.status(200).json(ResponseMessage.getErrorMessage("2027"));
                    } else {
                        return res.status(200).json(ResponseMessage.getErrorMessage("2020"));
                    }
                } else {
                    if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.CLOSED_PAYMENT) {
                        item.paymentStatus = LoyaltyPaymentTaskStatus.DENIED_CANCEL;
                        await this._storage.updatePaymentStatus(item.paymentId, item.paymentStatus);

                        return res.status(200).json(
                            this.makeResponseData(0, {
                                paymentId: item.paymentId,
                                purchaseId: item.purchaseId,
                                amount: item.amount.toString(),
                                currency: item.currency,
                                shopId: item.shopId,
                                account: item.account,
                                paymentStatus: item.paymentStatus
                            })
                        );
                    } else {
                        return res.status(200).json(ResponseMessage.getErrorMessage("2028"));
                    }
                }
            }
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/payment/cancel/approval : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * 결제 / 결제정보를 제공한다
     * POST /v1/payment/cancel/close
     * @private
     */
    private async payment_cancel_close(req: express.Request, res: express.Response) {
        console.log(`POST /v1/payment/cancel/close`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const accessKey: string = String(req.body.accessKey).trim();
            if (accessKey !== FakerRelayServer.ACCESS_KEY) {
                return res.json(ResponseMessage.getErrorMessage("2002"));
            }

            const confirm: boolean =
                String(req.body.confirm)
                    .trim()
                    .toLowerCase() === "true";
            const paymentId: string = String(req.body.paymentId).trim();
            const item = await this._storage.getPayment(paymentId);
            if (item === undefined) {
                return res.status(200).json(ResponseMessage.getErrorMessage("2003"));
            } else {
                const contract = this.ledgerContract;
                const loyaltyPaymentData = await contract.loyaltyPaymentOf(paymentId);
                if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.CLOSED_PAYMENT) {
                    if (item.paymentStatus === LoyaltyPaymentTaskStatus.DENIED_CANCEL) {
                        item.paymentStatus = LoyaltyPaymentTaskStatus.FAILED_CANCEL;
                        item.closeCancelTimestamp = ContractUtils.getTimeStamp();
                        await this._storage.updatePayment(item);

                        return res.status(200).json(
                            this.makeResponseData(0, {
                                paymentId: item.paymentId,
                                purchaseId: item.purchaseId,
                                amount: item.amount.toString(),
                                currency: item.currency,
                                shopId: item.shopId,
                                account: item.account,
                                loyaltyType: item.loyaltyType,
                                paidPoint: item.paidPoint.toString(),
                                paidToken: item.paidToken.toString(),
                                paidValue: item.paidValue.toString(),
                                feePoint: item.feePoint.toString(),
                                feeToken: item.feeToken.toString(),
                                feeValue: item.feeValue.toString(),
                                totalPoint: item.totalPoint.toString(),
                                totalToken: item.totalToken.toString(),
                                totalValue: item.totalValue.toString(),
                                paymentStatus: item.paymentStatus,
                                openNewTimestamp: item.openNewTimestamp,
                                closeNewTimestamp: item.closeNewTimestamp,
                                openCancelTimestamp: item.openCancelTimestamp,
                                closeCancelTimestamp: item.closeCancelTimestamp
                            })
                        );
                    } else if (
                        item.paymentStatus === LoyaltyPaymentTaskStatus.OPENED_CANCEL ||
                        item.paymentStatus === LoyaltyPaymentTaskStatus.APPROVED_CANCEL_FAILED_TX ||
                        item.paymentStatus === LoyaltyPaymentTaskStatus.APPROVED_CANCEL_SENT_TX ||
                        item.paymentStatus === LoyaltyPaymentTaskStatus.APPROVED_CANCEL_CONFIRMED_TX ||
                        item.paymentStatus === LoyaltyPaymentTaskStatus.APPROVED_CANCEL_REVERTED_TX
                    ) {
                        const timeout = FakerRelayServer.PAYMENT_TIMEOUT_SECONDS - 5;
                        if (ContractUtils.getTimeStamp() - item.openCancelTimestamp > timeout) {
                            item.paymentStatus = LoyaltyPaymentTaskStatus.FAILED_CANCEL;
                            item.closeCancelTimestamp = ContractUtils.getTimeStamp();
                            await this._storage.updatePayment(item);
                            return res.status(200).json(
                                this.makeResponseData(0, {
                                    paymentId: item.paymentId,
                                    purchaseId: item.purchaseId,
                                    amount: item.amount.toString(),
                                    currency: item.currency,
                                    shopId: item.shopId,
                                    account: item.account,
                                    loyaltyType: item.loyaltyType,
                                    paidPoint: item.paidPoint.toString(),
                                    paidToken: item.paidToken.toString(),
                                    paidValue: item.paidValue.toString(),
                                    feePoint: item.feePoint.toString(),
                                    feeToken: item.feeToken.toString(),
                                    feeValue: item.feeValue.toString(),
                                    totalPoint: item.totalPoint.toString(),
                                    totalToken: item.totalToken.toString(),
                                    totalValue: item.totalValue.toString(),
                                    paymentStatus: item.paymentStatus,
                                    openNewTimestamp: item.openNewTimestamp,
                                    closeNewTimestamp: item.closeNewTimestamp,
                                    openCancelTimestamp: item.openCancelTimestamp,
                                    closeCancelTimestamp: item.closeCancelTimestamp
                                })
                            );
                        } else {
                            return res.status(200).json(ResponseMessage.getErrorMessage("2030"));
                        }
                    } else if (
                        item.paymentStatus === LoyaltyPaymentTaskStatus.CLOSED_CANCEL ||
                        item.paymentStatus === LoyaltyPaymentTaskStatus.FAILED_CANCEL
                    ) {
                        item.paymentStatus = LoyaltyPaymentTaskStatus.FAILED_CANCEL;
                        item.closeCancelTimestamp = ContractUtils.getTimeStamp();
                        await this._storage.updatePayment(item);
                        return res.status(200).json(ResponseMessage.getErrorMessage("2029"));
                    } else {
                        return res.status(200).json(ResponseMessage.getErrorMessage("2024"));
                    }
                } else if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.OPENED_CANCEL) {
                    try {
                        const tx = await contract.closeCancelLoyaltyPayment(item.paymentId, confirm);

                        const event = await this.waitPaymentLoyalty(contract, tx);
                        if (event !== undefined) {
                            item.paymentStatus = confirm
                                ? LoyaltyPaymentTaskStatus.CLOSED_CANCEL
                                : LoyaltyPaymentTaskStatus.FAILED_CANCEL;
                            item.closeCancelTimestamp = ContractUtils.getTimeStamp();
                            this.updateEvent(event, item);
                            await this._storage.updatePayment(item);

                            return res.status(200).json(
                                this.makeResponseData(0, {
                                    paymentId: item.paymentId,
                                    purchaseId: item.purchaseId,
                                    amount: item.amount.toString(),
                                    currency: item.currency,
                                    shopId: item.shopId,
                                    account: item.account,
                                    loyaltyType: item.loyaltyType,
                                    paidPoint: item.paidPoint.toString(),
                                    paidToken: item.paidToken.toString(),
                                    paidValue: item.paidValue.toString(),
                                    feePoint: item.feePoint.toString(),
                                    feeToken: item.feeToken.toString(),
                                    feeValue: item.feeValue.toString(),
                                    totalPoint: item.totalPoint.toString(),
                                    totalToken: item.totalToken.toString(),
                                    totalValue: item.totalValue.toString(),
                                    paymentStatus: item.paymentStatus,
                                    openNewTimestamp: item.openNewTimestamp,
                                    closeNewTimestamp: item.closeNewTimestamp,
                                    openCancelTimestamp: item.openCancelTimestamp,
                                    closeCancelTimestamp: item.closeCancelTimestamp
                                })
                            );
                        } else {
                            return res.status(200).json(ResponseMessage.getErrorMessage("5000"));
                        }
                    } catch (error) {
                        const msg = ResponseMessage.getEVMErrorMessage(error);
                        console.log(`POST /v1/payment/cancel/close : ${msg.error.message}`);
                        return res.status(200).json(msg);
                    }
                } else if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.CLOSED_CANCEL) {
                    item.paymentStatus = LoyaltyPaymentTaskStatus.CLOSED_CANCEL;
                    item.closeCancelTimestamp = ContractUtils.getTimeStamp();
                    await this._storage.updatePaymentStatus(item.paymentId, item.paymentStatus);
                    return res.status(200).json(ResponseMessage.getErrorMessage("2026"));
                } else if (loyaltyPaymentData.status === ContractLoyaltyPaymentStatus.FAILED_PAYMENT) {
                    item.paymentStatus = LoyaltyPaymentTaskStatus.FAILED_CANCEL;
                    item.closeCancelTimestamp = ContractUtils.getTimeStamp();
                    await this._storage.updatePaymentStatus(item.paymentId, item.paymentStatus);
                    return res.status(200).json(ResponseMessage.getErrorMessage("2026"));
                } else {
                    item.paymentStatus = LoyaltyPaymentTaskStatus.CLOSED_CANCEL;
                    item.closeCancelTimestamp = ContractUtils.getTimeStamp();
                    await this._storage.updatePaymentStatus(item.paymentId, item.paymentStatus);
                    return res.status(200).json(ResponseMessage.getErrorMessage("2026"));
                }
            }
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/payment/cancel/close : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * 포인트의 종류를 선택한다.
     * POST /v1/ledger/changeToLoyaltyToken
     * @private
     */
    private async changeToLoyaltyToken(req: express.Request, res: express.Response) {
        console.info(`POST /v1/ledger/changeToLoyaltyToken`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const account: string = String(req.body.account).trim(); // 구매자의 주소
            const signature: string = String(req.body.signature).trim(); // 서명

            // 서명검증
            const userNonce = await this.ledgerContract.nonceOf(account);
            if (!ContractUtils.verifyLoyaltyType(account, userNonce, signature))
                return res.status(200).json(ResponseMessage.getErrorMessage("1501"));

            const tx = await this.ledgerContract.changeToLoyaltyToken(account, signature);

            console.info(`TxHash(changeToLoyaltyToken): ${tx.hash}`);
            return res.status(200).json(this.makeResponseData(0, { txHash: tx.hash }));
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/ledger/changeToLoyaltyToken : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * 포인트의 종류를 선택한다.
     * POST /v1/ledger/changeToPayablePoint
     * @private
     */
    private async changeToPayablePoint(req: express.Request, res: express.Response) {
        console.info(`POST /v1/ledger/changeToPayablePoint`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const phone: string = String(req.body.phone).trim();
            const account: string = String(req.body.account).trim(); // 구매자의 주소
            const signature: string = String(req.body.signature).trim(); // 서명

            // 서명검증
            const userNonce = await this.ledgerContract.nonceOf(account);
            if (!ContractUtils.verifyChangePayablePoint(phone, account, userNonce, signature))
                return res.status(200).json(ResponseMessage.getErrorMessage("1501"));

            const tx = await this.ledgerContract.changeToPayablePoint(phone, account, signature);

            console.info(`TxHash(changeToPayablePoint): ${tx.hash}`);
            return res.status(200).json(this.makeResponseData(0, { txHash: tx.hash }));
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/ledger/changeToPayablePoint : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * 상점을 추가한다.
     * POST /v1/shop/add
     * @private
     */
    private async shop_add(req: express.Request, res: express.Response) {
        console.info(`POST /v1/shop/add`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const shopId: string = String(req.body.shopId).trim();
            const name: string = String(req.body.name).trim();
            const currency: string = String(req.body.currency).trim();
            const account: string = String(req.body.account).trim();
            const signature: string = String(req.body.signature).trim(); // 서명

            const contract = await this.shopContract;
            if (!ContractUtils.verifyShop(shopId, await contract.nonceOf(account), account, signature))
                return res.status(200).json(ResponseMessage.getErrorMessage("1501"));

            const tx = await contract.add(shopId, name, currency, account, signature);

            console.info(`TxHash(/v1/shop/add): ${tx.hash}`);
            return res.status(200).json(this.makeResponseData(0, { txHash: tx.hash }));
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/shop/add : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * GET /v1/shop/task
     * @private
     */
    private async shop_task(req: express.Request, res: express.Response) {
        console.info(`GET /v1/shop/task`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const taskId: string = String(req.query.taskId).trim();
            const item = await this._storage.getTask(taskId);
            if (item === undefined) {
                return res.status(200).json(ResponseMessage.getErrorMessage("2033"));
            }
            return res.status(200).json(
                this.makeResponseData(0, {
                    taskId: item.taskId,
                    type: item.type,
                    shopId: item.shopId,
                    name: item.name,
                    currency: item.currency,
                    provideWaitTime: item.provideWaitTime,
                    providePercent: item.providePercent,
                    status: item.status,
                    taskStatus: item.taskStatus,
                    account: item.account,
                    timestamp: item.timestamp
                })
            );
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`GET /v1/shop/task : ${msg.error.message}`);
            return res.status(200).json(this.makeResponseData(msg.code, undefined, msg.error));
        }
    }

    /**
     * 상점정보를 수정한다.
     * POST /v1/shop/update/create
     * @private
     */
    private async shop_update_create(req: express.Request, res: express.Response) {
        console.info(`POST /v1/shop/update/create`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const accessKey: string = String(req.body.accessKey).trim();
            if (accessKey !== FakerRelayServer.ACCESS_KEY) {
                return res.json(ResponseMessage.getErrorMessage("2002"));
            }

            const shopId: string = String(req.body.shopId).trim();
            const name: string = String(req.body.name).trim();
            const currency: string = String(req.body.currency).trim();
            const provideWaitTime: number = Number(String(req.body.provideWaitTime).trim());
            const providePercent: number = Number(String(req.body.providePercent).trim());

            const shopInfo = await (await this.shopContract).shopOf(shopId);
            if (shopInfo.status !== ContractShopStatus.INVALID) {
                const taskId = ContractUtils.getTaskId(shopId);

                const item: ShopTaskData = {
                    taskId,
                    type: TaskResultType.UPDATE,
                    shopId,
                    name,
                    currency,
                    provideWaitTime,
                    providePercent,
                    status: shopInfo.status,
                    account: shopInfo.account,
                    taskStatus: ShopTaskStatus.OPENED,
                    timestamp: ContractUtils.getTimeStamp()
                };
                await this._storage.postTask(item);

                return res.status(200).json(
                    this.makeResponseData(0, {
                        taskId: item.taskId,
                        shopId: item.shopId,
                        name: item.name,
                        currency: item.currency,
                        provideWaitTime: item.provideWaitTime,
                        providePercent: item.providePercent,
                        taskStatus: item.taskStatus,
                        timestamp: item.timestamp
                    })
                );
            } else {
                return res.status(200).json(ResponseMessage.getErrorMessage("1201"));
            }
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/shop/update/create : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * 상점정보를 수정한다.
     * POST /v1/shop/update/approval
     * @private
     */
    private async shop_update_approval(req: express.Request, res: express.Response) {
        console.info(`POST /v1/shop/update/approval`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const taskId: string = String(req.body.taskId).trim();
            const approval: boolean =
                String(req.body.approval)
                    .trim()
                    .toLowerCase() === "true";
            const signature: string = String(req.body.signature).trim();
            const item = await this._storage.getTask(taskId);
            if (item === undefined) {
                return res.status(200).json(ResponseMessage.getErrorMessage("2033"));
            } else {
                const contract = await this.shopContract;

                if (item.taskStatus !== ShopTaskStatus.OPENED || item.type !== TaskResultType.UPDATE) {
                    return res.status(200).json(ResponseMessage.getErrorMessage("2040"));
                }

                const nonce = await contract.nonceOf(item.account);
                if (!ContractUtils.verifyShop(item.shopId, nonce, item.account, signature)) {
                    return res.status(200).json(ResponseMessage.getErrorMessage("1501"));
                }

                if (ContractUtils.getTimeStamp() - item.timestamp > FakerRelayServer.PAYMENT_TIMEOUT_SECONDS) {
                    const data = ResponseMessage.getErrorMessage("7000");
                    res.status(200).json(data);

                    item.taskStatus = ShopTaskStatus.TIMEOUT;
                    await this._storage.updateTaskStatus(item.taskId, item.taskStatus);
                    return;
                }

                if (approval) {
                    try {
                        const tx = await contract.update(
                            item.shopId,
                            item.name,
                            item.currency,
                            item.provideWaitTime,
                            item.providePercent,
                            item.account,
                            signature
                        );

                        item.taskStatus = ShopTaskStatus.CONFIRMED;
                        await this._storage.updateTaskStatus(item.taskId, item.taskStatus);

                        const event = await this.waitAndUpdateEvent(contract, tx);
                        if (event !== undefined) {
                            item.name = event.name;
                            item.currency = event.currency;
                            item.providePercent = event.providePercent;
                            item.provideWaitTime = event.provideWaitTime;
                            item.status = event.status;
                            item.taskStatus = ShopTaskStatus.COMPLETED;
                            await this._storage.updateTask(item);

                            return res.status(200).json(
                                this.makeResponseData(0, {
                                    taskId: item.taskId,
                                    shopId: item.shopId,
                                    name: item.name,
                                    currency: item.currency,
                                    provideWaitTime: item.provideWaitTime,
                                    providePercent: item.providePercent,
                                    taskStatus: item.taskStatus,
                                    timestamp: item.timestamp,
                                    txHash: tx.hash
                                })
                            );
                        } else {
                            return res.status(200).json(ResponseMessage.getErrorMessage("5000"));
                        }
                    } catch (error) {
                        const msg = ResponseMessage.getEVMErrorMessage(error);
                        console.log(`POST /v1/shop/update/approval : ${msg.error.message}`);
                        return res.status(200).json(msg);
                    }
                } else {
                    item.taskStatus = ShopTaskStatus.DENIED;
                    await this._storage.updateTaskStatus(item.taskId, item.taskStatus);

                    return res.status(200).json(
                        this.makeResponseData(0, {
                            taskId: item.taskId,
                            shopId: item.shopId,
                            name: item.name,
                            provideWaitTime: item.provideWaitTime,
                            providePercent: item.providePercent,
                            taskStatus: item.taskStatus,
                            timestamp: item.timestamp
                        })
                    );
                }
            }
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/shop/update/approval : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * 상점정보를 삭제한다.
     * POST /v1/shop/status/create
     * @private
     */
    private async shop_status_create(req: express.Request, res: express.Response) {
        console.info(`POST /v1/shop/status/create`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const accessKey: string = String(req.body.accessKey).trim();
            if (accessKey !== FakerRelayServer.ACCESS_KEY) {
                return res.json(ResponseMessage.getErrorMessage("2002"));
            }

            const shopId: string = String(req.body.shopId).trim();
            const status: number = Number(String(req.body.status).trim());
            const shopInfo = await (await this.shopContract).shopOf(shopId);
            if (shopInfo.status !== 0) {
                const taskId = ContractUtils.getTaskId(shopId);

                const item: ShopTaskData = {
                    taskId,
                    type: TaskResultType.STATUS,
                    shopId,
                    name: shopInfo.name,
                    currency: shopInfo.currency,
                    provideWaitTime: shopInfo.provideWaitTime.toNumber(),
                    providePercent: shopInfo.providePercent.toNumber(),
                    status,
                    account: shopInfo.account,
                    taskStatus: ShopTaskStatus.OPENED,
                    timestamp: ContractUtils.getTimeStamp()
                };
                await this._storage.postTask(item);

                return res.status(200).json(
                    this.makeResponseData(0, {
                        taskId: item.taskId,
                        shopId: item.shopId,
                        status: item.status,
                        taskStatus: item.taskStatus,
                        timestamp: item.timestamp
                    })
                );
            } else {
                return res
                    .status(200)
                    .json(this.makeResponseData(0, undefined, { message: "존재하지 않는 상점 아이디입니다" }));
            }
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/shop/status/create : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * 상점정보를 수정한다.
     * POST /v1/shop/status/approval
     * @private
     */
    private async shop_status_approval(req: express.Request, res: express.Response) {
        console.info(`POST /v1/shop/status/approval`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const taskId: string = String(req.body.taskId).trim();
            const approval: boolean =
                String(req.body.approval)
                    .trim()
                    .toLowerCase() === "true";
            const signature: string = String(req.body.signature).trim();
            const item = await this._storage.getTask(taskId);
            if (item === undefined) {
                return res.status(200).json(ResponseMessage.getErrorMessage("2033"));
            } else {
                if (item.taskStatus !== ShopTaskStatus.OPENED || item.type !== TaskResultType.STATUS) {
                    return res.status(200).json(ResponseMessage.getErrorMessage("2040"));
                }

                if (
                    !ContractUtils.verifyShop(
                        item.shopId,
                        await (await this.shopContract).nonceOf(item.account),
                        item.account,
                        signature
                    )
                ) {
                    return res.status(200).json(ResponseMessage.getErrorMessage("1501"));
                }

                if (ContractUtils.getTimeStamp() - item.timestamp > FakerRelayServer.PAYMENT_TIMEOUT_SECONDS) {
                    const data = ResponseMessage.getErrorMessage("7000");
                    res.status(200).json(data);

                    item.taskStatus = ShopTaskStatus.TIMEOUT;
                    await this._storage.updateTaskStatus(item.taskId, item.taskStatus);
                    return;
                }

                if (approval) {
                    const contract = await this.shopContract;
                    try {
                        const tx = await contract.changeStatus(item.shopId, item.status, item.account, signature);

                        item.taskStatus = ShopTaskStatus.CONFIRMED;
                        await this._storage.updateTaskStatus(item.taskId, item.taskStatus);

                        const event = await this.waitAndChangeStatusEvent(contract, tx);
                        if (event !== undefined) {
                            item.status = event.status;
                            item.taskStatus = ShopTaskStatus.COMPLETED;
                            await this._storage.updateTask(item);
                            return res.status(200).json(
                                this.makeResponseData(0, {
                                    taskId: item.taskId,
                                    shopId: item.shopId,
                                    status: item.status,
                                    taskStatus: item.taskStatus,
                                    timestamp: item.timestamp,
                                    txHash: tx.hash
                                })
                            );
                        } else {
                            return res.status(200).json(ResponseMessage.getErrorMessage("5000"));
                        }
                    } catch (error) {
                        const msg = ResponseMessage.getEVMErrorMessage(error);
                        console.log(`POST /v1/shop/status/approval : ${msg.error.message}`);
                        return res.status(200).json(msg);
                    }
                } else {
                    item.taskStatus = ShopTaskStatus.DENIED;
                    await this._storage.updateTaskStatus(item.taskId, item.taskStatus);

                    return res.status(200).json(
                        this.makeResponseData(0, {
                            taskId: item.taskId,
                            shopId: item.shopId,
                            status: item.status,
                            taskStatus: item.taskStatus,
                            timestamp: item.timestamp
                        })
                    );
                }
            }
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/shop/status/approval : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * 상점 정산금을 인출 신청한다.
     * POST /v1/shop/withdrawal/open
     * @private
     */
    private async shop_withdrawal_open(req: express.Request, res: express.Response) {
        console.info(`POST /v1/shop/withdrawal/open`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const shopId: string = String(req.body.shopId).trim();
            const amount: string = String(req.body.amount).trim(); // 구매 금액
            const account: string = String(req.body.account).trim();
            const signature: string = String(req.body.signature).trim(); // 서명

            // 서명검증
            const nonce = await (await this.shopContract).nonceOf(account);
            if (!ContractUtils.verifyShop(shopId, nonce, account, signature))
                return res.status(200).json(ResponseMessage.getErrorMessage("1501"));

            const tx = await (await this.shopContract).openWithdrawal(shopId, amount, account, signature);

            console.info(`TxHash(/v1/shop/withdrawal/open): ${tx.hash}`);
            return res.status(200).json(this.makeResponseData(0, { txHash: tx.hash }));
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/shop/withdrawal/open : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * 상점 정산금을 인출을 받은것을 확인한다.
     * POST /v1/shop/withdrawal/close
     * @private
     */
    private async shop_withdrawal_close(req: express.Request, res: express.Response) {
        console.info(`POST /v1/shop/withdrawal/close`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const shopId: string = String(req.body.shopId).trim();
            const account: string = String(req.body.account).trim();
            const signature: string = String(req.body.signature).trim(); // 서명

            // 서명검증
            const nonce = await (await this.shopContract).nonceOf(account);
            if (!ContractUtils.verifyShop(shopId, nonce, account, signature))
                return res.status(200).json(ResponseMessage.getErrorMessage("1501"));

            const tx = await (await this.shopContract).closeWithdrawal(shopId, account, signature);

            console.info(`TxHash(/v1/shop/withdrawal/close): ${tx.hash}`);
            return res.status(200).json(this.makeResponseData(0, { txHash: tx.hash }));
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/shop/withdrawal/close : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    /**
     * POST /v1/mobile/register
     * @private
     */
    private async mobile_register(req: express.Request, res: express.Response) {
        console.info(`POST /v1/mobile/register`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(ResponseMessage.getErrorMessage("2001", { validation: errors.array() }));
        }

        try {
            const account: string = String(req.body.account).trim();
            const token: string = String(req.body.token).trim();
            const language: string = String(req.body.language).trim();
            const os: string = String(req.body.os).trim();
            const signature: string = String(req.body.signature).trim();

            // 서명검증
            if (!ContractUtils.verifyMobileToken(account, token, signature))
                return res.status(200).json(ResponseMessage.getErrorMessage("1501"));

            const item = {
                account,
                token,
                language,
                os
            };
            return res.status(200).json(this.makeResponseData(0, item));
        } catch (error) {
            const msg = ResponseMessage.getEVMErrorMessage(error);
            console.log(`POST /v1/mobile/register : ${msg.error.message}`);
            return res.status(200).json(msg);
        }
    }

    private updateEvent(event: ContractLoyaltyPaymentEvent, item: LoyaltyPaymentTaskData): void {
        if (item.paymentId !== event.paymentId) return;
        item.purchaseId = event.purchaseId;
        item.currency = event.currency;
        item.shopId = event.shopId;
        item.account = event.account;
        item.loyaltyType = event.loyaltyType;
        item.paidPoint = event.paidPoint;
        item.paidToken = event.paidToken;
        item.paidValue = event.paidValue;
        item.feePoint = event.feePoint;
        item.feeToken = event.feeToken;
        item.feeValue = event.feeValue;
        item.totalPoint = event.totalPoint;
        item.totalToken = event.totalToken;
        item.totalValue = event.totalValue;
    }

    private async waitPaymentLoyalty(
        contract: Ledger,
        tx: ContractTransaction
    ): Promise<ContractLoyaltyPaymentEvent | undefined> {
        const res: any = {};
        const contractReceipt = await tx.wait();
        const log = findLog(contractReceipt, contract.interface, "LoyaltyPaymentEvent");
        if (log !== undefined) {
            const parsedLog = contract.interface.parseLog(log);

            res.paymentId = parsedLog.args.payment.paymentId;
            res.purchaseId = parsedLog.args.payment.purchaseId;
            res.amount = BigNumber.from(parsedLog.args.payment.paidValue);
            res.currency = parsedLog.args.payment.currency;
            res.shopId = parsedLog.args.payment.shopId;
            res.account = parsedLog.args.payment.account;
            res.timestamp = parsedLog.args.payment.timestamp;
            res.loyaltyType = parsedLog.args.payment.loyaltyType;
            res.paidPoint =
                parsedLog.args.payment.loyaltyType === ContractLoyaltyType.POINT
                    ? BigNumber.from(parsedLog.args.payment.paidPoint)
                    : BigNumber.from(0);
            res.paidToken =
                parsedLog.args.payment.loyaltyType === ContractLoyaltyType.TOKEN
                    ? BigNumber.from(parsedLog.args.payment.paidToken)
                    : BigNumber.from(0);
            res.paidValue = BigNumber.from(parsedLog.args.payment.paidValue);

            res.feePoint =
                parsedLog.args.payment.loyaltyType === ContractLoyaltyType.POINT
                    ? BigNumber.from(parsedLog.args.payment.feePoint)
                    : BigNumber.from(0);
            res.feeToken =
                parsedLog.args.payment.loyaltyType === ContractLoyaltyType.TOKEN
                    ? BigNumber.from(parsedLog.args.payment.feeToken)
                    : BigNumber.from(0);
            res.feeValue = BigNumber.from(parsedLog.args.payment.feeValue);

            res.status = BigNumber.from(parsedLog.args.payment.status);
            res.balance = BigNumber.from(parsedLog.args.balance);

            res.totalPoint = res.paidPoint.add(res.feePoint);
            res.totalToken = res.paidToken.add(res.feeToken);
            res.totalValue = res.paidValue.add(res.feeValue);

            return res;
        } else return undefined;
    }

    private async waitAndUpdateEvent(
        contract: ShopCollection,
        tx: ContractTransaction
    ): Promise<ContractShopUpdateEvent | undefined> {
        const contractReceipt = await tx.wait();
        const log = findLog(contractReceipt, contract.interface, "UpdatedShop");
        if (log !== undefined) {
            const parsedLog = contract.interface.parseLog(log);

            return {
                shopId: parsedLog.args.shopId,
                name: parsedLog.args.name,
                currency: parsedLog.args.currency,
                provideWaitTime: (parsedLog.args.provideWaitTime as BigNumber).toNumber(),
                providePercent: (parsedLog.args.providePercent as BigNumber).toNumber(),
                account: parsedLog.args.account,
                status: parsedLog.args.status
            };
        } else return undefined;
    }

    private async waitAndChangeStatusEvent(
        contract: ShopCollection,
        tx: ContractTransaction
    ): Promise<ContractShopStatusEvent | undefined> {
        const contractReceipt = await tx.wait();
        const log = findLog(contractReceipt, contract.interface, "ChangedShopStatus");
        if (log !== undefined) {
            const parsedLog = contract.interface.parseLog(log);
            return {
                shopId: parsedLog.args.shopId,
                status: parsedLog.args.status
            };
        } else return undefined;
    }

    private async getPaymentId(account: string): Promise<string> {
        const nonce = await this.ledgerContract.nonceOf(account);
        // 내부에 랜덤으로 32 Bytes 를 생성하여 ID를 생성하므로 무한반복될 가능성이 극히 낮음
        while (true) {
            const id = ContractUtils.getPaymentId(account, nonce);
            if (await this.ledgerContract.isAvailablePaymentId(id)) return id;
        }
    }
}
