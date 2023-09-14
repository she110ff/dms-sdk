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
import { LinkCollection, LinkCollection__factory } from "del-osx-lib";
import { Ledger, Ledger__factory } from "dms-osx-lib";

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
        // 마일리지를 이용하여 구매
        this.app.post(
            "/payMileage",
            [
                body("purchaseId").exists(),
                body("amount").custom(Utils.isAmount),
                body("email")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{64}$/i),
                body("franchiseeId").exists(),
                body("signer")
                    .exists()
                    .isEthereumAddress(),
                body("signature")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.payMileage.bind(this)
        );

        // 토큰을 이용하여 구매할 때
        this.app.post(
            "/payToken",
            [
                body("purchaseId").exists(),
                body("amount").custom(Utils.isAmount),
                body("email")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{64}$/i),
                body("franchiseeId").exists(),
                body("signer")
                    .exists()
                    .isEthereumAddress(),
                body("signature")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.payToken.bind(this)
        );

        // 토큰을 마일리지로 교환할 때
        this.app.post(
            "/exchangeTokenToMileage",
            [
                body("email")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{64}$/i),
                body("amountToken").custom(Utils.isAmount),
                body("signer")
                    .exists()
                    .isEthereumAddress(),
                body("signature")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.exchangeTokenToMileage.bind(this)
        );

        // 마일리지를 토큰으로 교환할 때
        this.app.post(
            "/exchangeMileageToToken",
            [
                body("email")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{64}$/i),
                body("amountMileage").custom(Utils.isAmount),
                body("signer")
                    .exists()
                    .isEthereumAddress(),
                body("signature")
                    .exists()
                    .matches(/^(0x)[0-9a-f]{130}$/i)
            ],
            this.exchangeMileageToToken.bind(this)
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

    private get linkCollectionContract(): LinkCollection {
        return LinkCollection__factory.connect(this.deployment.linkCollection.address, this.signer) as LinkCollection;
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
     * 사용자 마일리지 지불
     * POST /payMileage
     * @private
     */
    private async payMileage(req: express.Request, res: express.Response) {
        console.log(`POST /payMileage`);

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
            const email: string = String(req.body.email); // 구매한 사용자의 이메일 해시
            const franchiseeId: string = String(req.body.franchiseeId); // 구매한 가맹점 아이디
            const signer: string = String(req.body.signer); // 구매자의 주소
            const signature: string = String(req.body.signature); // 서명

            // 서명검증
            const userNonce = await this.ledgerContract.nonceOf(signer);
            if (!ContractUtils.verifyPayment(purchaseId, amount, email, franchiseeId, signer, userNonce, signature))
                return res.status(200).json(
                    this.makeResponseData(500, undefined, {
                        message: "Signature is not valid."
                    })
                );

            // 컨트랙트에서 이메일 등록여부 체크 및 구매자 주소와 동일여부
            const emailToAddress: string = await this.linkCollectionContract.toAddress(email);
            if (emailToAddress !== signer) {
                return res.status(200).json(
                    this.makeResponseData(502, undefined, {
                        message: "Email is not valid."
                    })
                );
            }
            const tx = await this.ledgerContract
                .connect(this.signer)
                .payMileage(purchaseId, amount, email, franchiseeId, signer, signature);

            console.log(`TxHash(payMileage): `, tx.hash);
            return res.status(200).json(this.makeResponseData(200, { txHash: tx.hash }));
        } catch (error) {
            let message = ContractUtils.cacheEVMError(error as any);
            if (message === "") message = "Failed pay mileage";
            console.error(`POST /payMileage :`, message);
            return res.status(200).json(
                this.makeResponseData(500, undefined, {
                    message
                })
            );
        }
    }

    private async payToken(req: express.Request, res: express.Response) {
        console.log(`POST /payToken`);

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
            const email: string = String(req.body.email); // 구매한 사용자의 이메일 해시
            const franchiseeId: string = String(req.body.franchiseeId); // 구매한 가맹점 아이디
            const signer: string = String(req.body.signer); // 구매자의 주소
            const signature: string = String(req.body.signature); // 서명

            // 서명검증
            const userNonce = await this.ledgerContract.nonceOf(signer);
            if (!ContractUtils.verifyPayment(purchaseId, amount, email, franchiseeId, signer, userNonce, signature))
                return res.status(200).json(
                    this.makeResponseData(500, undefined, {
                        message: "Signature is not valid."
                    })
                );

            // 컨트랙트에서 이메일 등록여부 체크 및 구매자 주소와 동일여부
            const emailToAddress: string = await this.linkCollectionContract.toAddress(email);
            if (emailToAddress !== signer) {
                return res.status(200).json(
                    this.makeResponseData(502, undefined, {
                        message: "Email is not valid."
                    })
                );
            }
            const tx = await this.ledgerContract
                .connect(this.signer)
                .payToken(purchaseId, amount, email, franchiseeId, signer, signature);

            console.log(`TxHash(payToken): `, tx.hash);
            return res.status(200).json(this.makeResponseData(200, { txHash: tx.hash }));
        } catch (error) {
            let message = ContractUtils.cacheEVMError(error as any);
            if (message === "") message = "Failed pay token";
            console.error(`POST /payToken :`, message);
            return res.status(200).json(
                this.makeResponseData(500, undefined, {
                    message
                })
            );
        }
    }

    /**
     * 토큰을 마일리지로 교환합니다
     * POST /exchangeTokenToMileage
     * @private
     */
    private async exchangeTokenToMileage(req: express.Request, res: express.Response) {
        console.log(`POST /exchangeTokenToMileage`);

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
            const email: string = String(req.body.email); // 구매한 사용자의 이메일 해시
            const amountToken: string = String(req.body.amountToken); // 교환할 마일리지의 량
            const signer: string = String(req.body.signer); // 구매자의 주소
            const signature: string = String(req.body.signature); // 서명

            // 서명검증
            const userNonce = await this.ledgerContract.nonceOf(signer);
            if (!ContractUtils.verifyExchange(signer, email, amountToken, userNonce, signature))
                return res.status(200).json(
                    this.makeResponseData(500, undefined, {
                        message: "Signature is not valid."
                    })
                );

            // 컨트랙트에서 이메일 등록여부 체크 및 구매자 주소와 동일여부
            const emailToAddress: string = await this.linkCollectionContract.toAddress(email);
            if (emailToAddress !== signer) {
                return res.status(200).json(
                    this.makeResponseData(502, undefined, {
                        message: "Email is not valid."
                    })
                );
            }
            const tx = await this.ledgerContract
                .connect(this.signer)
                .exchangeTokenToMileage(email, amountToken, signer, signature);

            console.log(`TxHash(exchangeTokenToMileage): `, tx.hash);
            return res.json(this.makeResponseData(200, { txHash: tx.hash }));
        } catch (error) {
            let message = ContractUtils.cacheEVMError(error as any);
            if (message === "") message = "Failed exchange Token To Mileage";
            console.error(`POST /exchangeTokenToMileage :`, message);
            return res.status(200).json(
                this.makeResponseData(500, undefined, {
                    message
                })
            );
        }
    }

    /**
     * 마일리지를 토큰으로 교환합니다
     * POST /exchangeMileageToToken
     * @private
     */
    private async exchangeMileageToToken(req: express.Request, res: express.Response) {
        console.log(`POST /exchangeMileageToToken`);

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
            const email: string = String(req.body.email); // 구매한 사용자의 이메일 해시
            const amountMileage: string = String(req.body.amountMileage); // 교환할 마일리지의 량
            const signer: string = String(req.body.signer); // 구매자의 주소
            const signature: string = String(req.body.signature); // 서명

            // 서명검증
            const userNonce = await this.ledgerContract.nonceOf(signer);
            if (!ContractUtils.verifyExchange(signer, email, amountMileage, userNonce, signature))
                return res.status(200).json(
                    this.makeResponseData(500, undefined, {
                        message: "Signature is not valid."
                    })
                );

            // 컨트랙트에서 이메일 등록여부 체크 및 구매자 주소와 동일여부
            const emailToAddress: string = await this.linkCollectionContract.toAddress(email);
            if (emailToAddress !== signer) {
                return res.status(200).json(
                    this.makeResponseData(502, undefined, {
                        message: "Email is not valid."
                    })
                );
            }
            const tx = await this.ledgerContract
                .connect(this.signer)
                .exchangeMileageToToken(email, amountMileage, signer, signature);

            console.log(`TxHash(exchangeMileageToToken): `, tx.hash);
            return res.status(200).json(this.makeResponseData(200, { txHash: tx.hash }));
        } catch (error) {
            let message = ContractUtils.cacheEVMError(error as any);
            if (message === "") message = "Failed exchange Mileage To Token";
            console.error(`POST /exchangeMileageToToken :`, message);
            return res.status(200).json(
                this.makeResponseData(500, undefined, {
                    message
                })
            );
        }
    }
}
