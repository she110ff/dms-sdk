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
import { body, validationResult } from "express-validator";

import { NonceManager } from "@ethersproject/experimental";
import { Signer } from "@ethersproject/abstract-signer";

import { ContractUtils } from "../../src";
import { GanacheServer } from "./GanacheServer";
import { Deployment } from "./deployContracts";
import { PhoneLinkCollection, PhoneLinkCollection__factory } from "del-osx-lib";
import { Ledger, Ledger__factory, ShopCollection, ShopCollection__factory } from "dms-osx-lib";

import { Utils } from "./Utils";

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

    /**
     * Constructor
     * @param port The bind port
     * @param deploymentContract The deployment contracts
     */
    constructor(port: number | string, deploymentContract: Deployment) {
        if (typeof port === "string") this.port = parseInt(port, 10);
        else this.port = port;

        this.app = e();
        this.deployment = deploymentContract;
        this._accounts = GanacheServer.accounts();
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
        // 포인트를 이용하여 구매
        this.app.post(
            "/ledger/payPoint",
            [
                body("purchaseId").exists(),
                body("amount").custom(Utils.isAmount),
                body("currency").exists(),
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
            this.payPoint.bind(this)
        );

        // 토큰을 이용하여 구매할 때
        this.app.post(
            "/ledger/payToken",
            [
                body("purchaseId").exists(),
                body("amount").custom(Utils.isAmount),
                body("currency").exists(),
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
            this.payToken.bind(this)
        );

        this.app.post(
            "/ledger/changeToLoyaltyToken",
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
            "/ledger/changeToPayablePoint",
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
            "/shop/add",
            [
                body("shopId")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{64}$/i),
                body("name").exists(),
                body("provideWaitTime")
                    .exists()
                    .custom(Utils.isAmount),
                body("providePercent")
                    .exists()
                    .custom(Utils.isAmount),
                body("account")
                    .exists()
                    .isEthereumAddress(),
                body("signature")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.shop_add.bind(this)
        );

        this.app.post(
            "/shop/update",
            [
                body("shopId")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{64}$/i),
                body("name").exists(),
                body("provideWaitTime")
                    .exists()
                    .custom(Utils.isAmount),
                body("providePercent")
                    .exists()
                    .custom(Utils.isAmount),
                body("account")
                    .exists()
                    .isEthereumAddress(),
                body("signature")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.shop_update.bind(this)
        );

        this.app.post(
            "/shop/remove",
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
            this.shop_remove.bind(this)
        );
        this.app.post(
            "/shop/openWithdrawal",
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
            this.shop_openWithdrawal.bind(this)
        );

        this.app.post(
            "/shop/closeWithdrawal",
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
            this.shop_closeWithdrawal.bind(this)
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

    private get linkCollectionContract(): PhoneLinkCollection {
        return PhoneLinkCollection__factory.connect(
            this.deployment.phoneLinkCollection.address,
            this.signer
        ) as PhoneLinkCollection;
    }

    private get shopContract(): ShopCollection {
        return ShopCollection__factory.connect(this.deployment.shopCollection.address, this.signer) as ShopCollection;
    }

    private get signer(): Signer {
        return new NonceManager(this._accounts[1]);
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
     * 사용자 포인트 지불
     * POST /payPoint
     * @private
     */
    private async payPoint(req: express.Request, res: express.Response) {
        console.log(`POST /ledger/payPoint`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(
                this.makeResponseData(501, undefined, {
                    message: "Failed to check the validity of parameters.",
                    validation: errors.array()
                })
            );
        }

        try {
            const purchaseId: string = String(req.body.purchaseId); // 구매 아이디
            const amount: string = String(req.body.amount); // 구매 금액
            const currency: string = String(req.body.currency).toLowerCase(); // 구매한 금액 통화코드
            const shopId: string = String(req.body.shopId); // 구매한 가맹점 아이디
            const account: string = String(req.body.account); // 구매자의 주소
            const signature: string = String(req.body.signature); // 서명

            // 서명검증
            const userNonce = await this.ledgerContract.nonceOf(account);
            if (!ContractUtils.verifyPayment(purchaseId, amount, currency, shopId, account, userNonce, signature))
                return res.status(200).json(
                    this.makeResponseData(500, undefined, {
                        message: "Signature is not valid."
                    })
                );

            const tx = await this.ledgerContract
                .connect(this.signer)
                .payPoint({ purchaseId, amount, currency, shopId, account, signature });

            console.log(`TxHash(/ledger/payPoint): `, tx.hash);
            return res.status(200).json(this.makeResponseData(200, { txHash: tx.hash }));
        } catch (error) {
            let message = ContractUtils.cacheEVMError(error as any);
            if (message === "") message = "Failed pay point";
            console.error(`POST /ledger/payPoint :`, message);
            return res.status(200).json(
                this.makeResponseData(500, undefined, {
                    message
                })
            );
        }
    }

    private async payToken(req: express.Request, res: express.Response) {
        console.log(`POST /ledger/payToken`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(
                this.makeResponseData(501, undefined, {
                    message: "Failed to check the validity of parameters.",
                    validation: errors.array()
                })
            );
        }

        try {
            const purchaseId: string = String(req.body.purchaseId); // 구매 아이디
            const amount: string = String(req.body.amount); // 구매 금액
            const currency: string = String(req.body.currency).toLowerCase(); // 구매한 금액 통화코드
            const shopId: string = String(req.body.shopId); // 구매한 가맹점 아이디
            const account: string = String(req.body.account); // 구매자의 주소
            const signature: string = String(req.body.signature); // 서명

            // 서명검증
            const userNonce = await this.ledgerContract.nonceOf(account);
            if (!ContractUtils.verifyPayment(purchaseId, amount, currency, shopId, account, userNonce, signature))
                return res.status(200).json(
                    this.makeResponseData(500, undefined, {
                        message: "Signature is not valid."
                    })
                );

            const tx = await this.ledgerContract
                .connect(this.signer)
                .payToken({ purchaseId, amount, currency, shopId, account, signature });

            console.log(`TxHash(/ledger/payToken): `, tx.hash);
            return res.status(200).json(this.makeResponseData(200, { txHash: tx.hash }));
        } catch (error) {
            let message = ContractUtils.cacheEVMError(error as any);
            if (message === "") message = "Failed pay token";
            console.error(`POST /ledger/payToken :`, message);
            return res.status(200).json(
                this.makeResponseData(500, undefined, {
                    message
                })
            );
        }
    }

    private async changeToLoyaltyToken(req: express.Request, res: express.Response) {
        console.log(`POST /ledger/changeToLoyaltyToken`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(
                this.makeResponseData(501, undefined, {
                    message: "Failed to check the validity of parameters.",
                    validation: errors.array()
                })
            );
        }

        try {
            const account: string = String(req.body.account); // 구매자의 주소
            const signature: string = String(req.body.signature); // 서명

            // 서명검증
            const userNonce = await this.ledgerContract.nonceOf(account);
            if (!ContractUtils.verifyLoyaltyType(account, userNonce, signature))
                return res.status(200).json(
                    this.makeResponseData(500, undefined, {
                        message: "Signature is not valid."
                    })
                );

            const tx = await this.ledgerContract.connect(this.signer).changeToLoyaltyToken(account, signature);

            console.log(`TxHash(/ledger/changeToLoyaltyToken): `, tx.hash);
            return res.status(200).json(this.makeResponseData(200, { txHash: tx.hash }));
        } catch (error) {
            let message = ContractUtils.cacheEVMError(error as any);
            if (message === "") message = "Failed change loyalty type";
            console.error(`POST /ledger/changeToLoyaltyToken :`, message);
            return res.status(200).json(
                this.makeResponseData(500, undefined, {
                    message
                })
            );
        }
    }
    private async changeToPayablePoint(req: express.Request, res: express.Response) {
        console.log(`POST /ledger/changeToPayablePoint`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(
                this.makeResponseData(501, undefined, {
                    message: "Failed to check the validity of parameters.",
                    validation: errors.array()
                })
            );
        }

        try {
            const phone: string = String(req.body.phone); // 구매 금액
            const account: string = String(req.body.account); // 구매자의 주소
            const signature: string = String(req.body.signature); // 서명

            // 컨트랙트에서 전화번호 등록여부 체크 및 구매자 주소와 동일여부
            const phoneToAddress: string = await this.linkCollectionContract.toAddress(phone);
            if (phoneToAddress !== account) {
                return res.status(200).json(
                    this.makeResponseData(502, undefined, {
                        message: "Phone is not valid."
                    })
                );
            }

            // 서명검증
            const userNonce = await this.ledgerContract.nonceOf(account);
            if (!ContractUtils.verifyChangePayablePoint(phone, account, userNonce, signature))
                return res.status(200).json(
                    this.makeResponseData(500, undefined, {
                        message: "Signature is not valid."
                    })
                );

            const tx = await this.ledgerContract.connect(this.signer).changeToPayablePoint(phone, account, signature);

            console.log(`TxHash(/ledger/changeToPayablePoint): `, tx.hash);
            return res.status(200).json(this.makeResponseData(200, { txHash: tx.hash }));
        } catch (error) {
            let message = ContractUtils.cacheEVMError(error as any);
            if (message === "") message = "Failed change to payable point";
            console.error(`POST /ledger/changeToPayablePoint :`, message);
            return res.status(200).json(
                this.makeResponseData(500, undefined, {
                    message
                })
            );
        }
    }

    /**
     * 상점을 추가한다.
     * POST /shop/add
     * @private
     */
    private async shop_add(req: express.Request, res: express.Response) {
        console.log(`POST /shop/add`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(
                this.makeResponseData(501, undefined, {
                    message: "Failed to check the validity of parameters.",
                    validation: errors.array()
                })
            );
        }

        try {
            const shopId: string = String(req.body.shopId);
            const name: string = String(req.body.name);
            const provideWaitTime: number = Number(req.body.provideWaitTime);
            const providePercent: number = Number(req.body.providePercent);
            const account: string = String(req.body.account);
            const signature: string = String(req.body.signature); // 서명

            // 서명검증
            const nonce = await this.shopContract.nonceOf(account);
            if (!ContractUtils.verifyShop(shopId, name, provideWaitTime, providePercent, nonce, account, signature))
                return res.status(200).json(
                    this.makeResponseData(500, undefined, {
                        message: "Signature is not valid."
                    })
                );

            const tx = await this.shopContract
                .connect(this.signer)
                .add(shopId, name, provideWaitTime, providePercent, account, signature);

            console.log(`TxHash(/shop/add): `, tx.hash);
            return res.status(200).json(this.makeResponseData(200, { txHash: tx.hash }));
        } catch (error) {
            let message = ContractUtils.cacheEVMError(error as any);
            if (message === "") message = "Failed /shop/add";
            console.error(`POST /shop/add :`, message);
            return res.status(200).json(
                this.makeResponseData(500, undefined, {
                    message
                })
            );
        } finally {
        }
    }

    /**
     * 상점정보를 수정한다.
     * POST /shop/update
     * @private
     */
    private async shop_update(req: express.Request, res: express.Response) {
        console.log(`POST /shop/update`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(
                this.makeResponseData(501, undefined, {
                    message: "Failed to check the validity of parameters.",
                    validation: errors.array()
                })
            );
        }

        try {
            const shopId: string = String(req.body.shopId);
            const name: string = String(req.body.name);
            const provideWaitTime: number = Number(req.body.provideWaitTime);
            const providePercent: number = Number(req.body.providePercent);
            const account: string = String(req.body.account);
            const signature: string = String(req.body.signature); // 서명

            // 서명검증
            const nonce = await (await this.shopContract).nonceOf(account);
            if (!ContractUtils.verifyShop(shopId, name, provideWaitTime, providePercent, nonce, account, signature))
                return res.status(200).json(
                    this.makeResponseData(500, undefined, {
                        message: "Signature is not valid."
                    })
                );

            const tx = await (await this.shopContract)
                .connect(this.signer)
                .update(shopId, name, provideWaitTime, providePercent, account, signature);

            console.log(`TxHash(/shop/update): `, tx.hash);
            return res.status(200).json(this.makeResponseData(200, { txHash: tx.hash }));
        } catch (error) {
            let message = ContractUtils.cacheEVMError(error as any);
            if (message === "") message = "Failed /shop/update";
            console.error(`POST /shop/update :`, message);
            return res.status(200).json(
                this.makeResponseData(500, undefined, {
                    message
                })
            );
        } finally {
        }
    }

    /**
     * 상점정보를 삭제한다.
     * POST /shop/remove
     * @private
     */
    private async shop_remove(req: express.Request, res: express.Response) {
        console.log(`POST /shop/remove`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(
                this.makeResponseData(501, undefined, {
                    message: "Failed to check the validity of parameters.",
                    validation: errors.array()
                })
            );
        }

        try {
            const shopId: string = String(req.body.shopId);
            const account: string = String(req.body.account);
            const signature: string = String(req.body.signature); // 서명

            // 서명검증
            const nonce = await (await this.shopContract).nonceOf(account);
            if (!ContractUtils.verifyShopId(shopId, nonce, account, signature))
                return res.status(200).json(
                    this.makeResponseData(500, undefined, {
                        message: "Signature is not valid."
                    })
                );

            const tx = await (await this.shopContract).connect(this.signer).remove(shopId, account, signature);

            console.log(`TxHash(/shop/remove): `, tx.hash);
            return res.status(200).json(this.makeResponseData(200, { txHash: tx.hash }));
        } catch (error) {
            let message = ContractUtils.cacheEVMError(error as any);
            if (message === "") message = "Failed /shop/remove";
            console.error(`POST /shop/remove :`, message);
            return res.status(200).json(
                this.makeResponseData(500, undefined, {
                    message
                })
            );
        } finally {
        }
    }

    /**
     * 상점 정산금을 인출 신청한다.
     * POST /shop/openWithdrawal
     * @private
     */
    private async shop_openWithdrawal(req: express.Request, res: express.Response) {
        console.log(`POST /shop/openWithdrawal`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(
                this.makeResponseData(501, undefined, {
                    message: "Failed to check the validity of parameters.",
                    validation: errors.array()
                })
            );
        }

        try {
            const shopId: string = String(req.body.shopId);
            const amount: string = String(req.body.amount); // 구매 금액
            const account: string = String(req.body.account);
            const signature: string = String(req.body.signature); // 서명

            // 서명검증
            const nonce = await (await this.shopContract).nonceOf(account);
            if (!ContractUtils.verifyShopId(shopId, nonce, account, signature))
                return res.status(200).json(
                    this.makeResponseData(500, undefined, {
                        message: "Signature is not valid."
                    })
                );

            const tx = await (await this.shopContract)
                .connect(this.signer)
                .openWithdrawal(shopId, amount, account, signature);

            console.log(`TxHash(/shop/openWithdrawal): `, tx.hash);
            return res.status(200).json(this.makeResponseData(200, { txHash: tx.hash }));
        } catch (error) {
            let message = ContractUtils.cacheEVMError(error as any);
            if (message === "") message = "Failed /shop/openWithdrawal";
            console.error(`POST /shop/openWithdrawal :`, message);
            return res.status(200).json(
                this.makeResponseData(500, undefined, {
                    message
                })
            );
        } finally {
        }
    }

    /**
     * 상점 정산금을 인출을 받은것을 확인한다.
     * POST /shop/closeWithdrawal
     * @private
     */
    private async shop_closeWithdrawal(req: express.Request, res: express.Response) {
        console.log(`POST /shop/closeWithdrawal`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(200).json(
                this.makeResponseData(501, undefined, {
                    message: "Failed to check the validity of parameters.",
                    validation: errors.array()
                })
            );
        }

        try {
            const shopId: string = String(req.body.shopId);
            const account: string = String(req.body.account);
            const signature: string = String(req.body.signature); // 서명

            // 서명검증
            const nonce = await (await this.shopContract).nonceOf(account);
            if (!ContractUtils.verifyShopId(shopId, nonce, account, signature))
                return res.status(200).json(
                    this.makeResponseData(500, undefined, {
                        message: "Signature is not valid."
                    })
                );

            const tx = await (await this.shopContract).connect(this.signer).closeWithdrawal(shopId, account, signature);

            console.log(`TxHash(/shop/closeWithdrawal): `, tx.hash);
            return res.status(200).json(this.makeResponseData(200, { txHash: tx.hash }));
        } catch (error) {
            let message = ContractUtils.cacheEVMError(error as any);
            if (message === "") message = "Failed /shop/closeWithdrawal";
            console.error(`POST /shop/closeWithdrawal :`, message);
            return res.status(200).json(
                this.makeResponseData(500, undefined, {
                    message
                })
            );
        } finally {
        }
    }
}
