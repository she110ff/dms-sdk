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
import * as http from "http";
// @ts-ignore
import e, * as express from "express";
import { BigNumber } from "ethers";
import { ContractUtils } from "../../src";
import { Deployment } from "./deployContracts";

/**
 * This is an Agora node for testing.
 * The test code allows the Agora node to be started and shut down.
 */
export class TestRelayServer {
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
    }

    /**
     * Start the web server
     */
    public start(): Promise<void> {
        // parse application/x-www-form-urlencoded
        this.app.use(bodyParser.urlencoded({ extended: false }));
        // parse application/json
        this.app.use(bodyParser.json());

        this.app.get("/", [], this.getHealthStatus.bind(this));
        // 마일리지를 이용하여 구매
        this.app.post("/payMileage", this.payMileage.bind(this));
        this.app.post("/payToken", this.payToken.bind(this));
        this.app.post("/exchangeTokenToMileage", this.exchangeTokenToMileage.bind(this));
        this.app.post("/exchangeMileageToToken", this.exchangeMileageToToken.bind(this));

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

    // @ts-ignore
    private async getHealthStatus(req: express.Request, res: express.Response) {
        return res.json("OK");
    }

    /**
     * 사용자 마일리지 지불
     * POST /payMileage
     * @private
     */
    private async payMileage(req: express.Request, res: express.Response) {
        const purchaseId: string = String(req.body.purchaseId); // 구매 아이디
        const amount: string = String(req.body.amount); // 구매 금액
        const email: string = String(req.body.email); // 구매한 사용자의 이메일 해시
        const franchiseeId: string = String(req.body.franchiseeId); // 구매한 가맹점 아이디
        const signer: string = String(req.body.signer); // 구매자의 주소
        const signature: string = String(req.body.signature); // 서명
        const userNonce = await this.deployment.ledger.nonceOf(signer);

        if (!ContractUtils.verifyPayment(purchaseId, amount, email, franchiseeId, signer, userNonce, signature))
            return res.status(200).json({
                code: 500,
                data: undefined,
                error: { message: "Signature is not valid." }
            });

        return res.status(200).send({ txHash: "0X1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" });
    }

    /**
     * 사용자 토큰 지불
     * POST /payToken
     * @private
     */
    private async payToken(req: express.Request, res: express.Response) {
        const purchaseId: string = String(req.body.purchaseId); // 구매 아이디
        const amount: string = String(req.body.amount); // 구매 금액
        const email: string = String(req.body.email); // 구매한 사용자의 이메일 해시
        const franchiseeId: string = String(req.body.franchiseeId); // 구매한 가맹점 아이디
        const signer: string = String(req.body.signer); // 구매자의 주소
        const signature: string = String(req.body.signature); // 서명
        const userNonce = await this.deployment.ledger.nonceOf(signer);

        if (!ContractUtils.verifyPayment(purchaseId, amount, email, franchiseeId, signer, userNonce, signature))
            return res.status(200).json({
                code: 500,
                data: undefined,
                error: { message: "Signature is not valid." }
            });

        return res.status(200).send({ txHash: "0X1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" });
    }

    /**
     * 토큰을 마일리지로 교환합니다
     * POST /exchangeTokenToMileage
     * @private
     */
    private async exchangeTokenToMileage(req: express.Request, res: express.Response) {
        try {
            const email: string = String(req.body.email); // 구매한 사용자의 이메일 해시
            const amountToken: string = String(req.body.amountToken); // 교환할 마일리지의 량
            const signer: string = String(req.body.signer); // 구매자의 주소
            const signature: string = String(req.body.signature); // 서명

            // TODO amountToken > 0 조건 검사
            // 서명검증
            const userNonce = await this.deployment.ledger.nonceOf(signer);
            if (!ContractUtils.verifyExchange(signer, email, amountToken, userNonce, signature))
                return res.status(200).json({
                    code: 500,
                    data: undefined,
                    error: { message: "Signature is not valid." }
                });

            // 이메일 EmailLinkerContract에 이메일 등록여부 체크 및 구매자 주소와 동일여부
            const emailToAddress: string = await this.deployment.linkCollection.toAddress(email);
            if (emailToAddress !== signer) {
                return res.status(200).json({
                    code: 500,
                    data: undefined,
                    error: { message: "Email is not valid." }
                });
            }

            return res.status(200).send({ txHash: "0X1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" });
        } catch (error) {
            return res.status(200).json({
                code: 500,
                data: undefined,
                error: { message: "Failed exchange Token To Mileage." }
            });
        }
    }

    /**
     * 마일리지를 토큰으로 교환합니다
     * POST /exchangeMileageToToken
     * @private
     */
    private async exchangeMileageToToken(req: express.Request, res: express.Response) {
        try {
            const email: string = String(req.body.email); // 구매한 사용자의 이메일 해시
            const amountMileage: string = String(req.body.amountMileage); // 교환할 마일리지의 량
            const signer: string = String(req.body.signer); // 구매자의 주소
            const signature: string = String(req.body.signature); // 서명

            // TODO amountMileage > 0 조건 검사
            // 서명검증
            const userNonce = await this.deployment.ledger.nonceOf(signer);
            if (!ContractUtils.verifyExchange(signer, email, amountMileage, userNonce, signature))
                return res.status(200).json({
                    code: 500,
                    data: undefined,
                    error: { message: "Signature is not valid." }
                });
            // 이메일 EmailLinkerContract에 이메일 등록여부 체크 및 구매자 주소와 동일여부
            const emailToAddress: string = await this.deployment.linkCollection.toAddress(email);
            if (emailToAddress !== signer) {
                return res.status(200).json({
                    code: 500,
                    data: undefined,
                    error: { message: "Email is not valid." }
                });
            }

            return res.status(200).send({ txHash: "0X1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ" });
        } catch (error) {
            return res.status(200).json({
                code: 500,
                data: undefined,
                error: { message: "Failed exchange Mileage To Token." }
            });
        }
    }
}

export function delay(interval: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, interval);
    });
}

export function isAmount(value: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (!isPositiveInteger(value)) {
            return reject(new Error("Invalid value"));
        }
        try {
            BigNumber.from(value);
        } catch (e) {
            return reject(new Error("Invalid value"));
        }
        return resolve(value);
    });
}

function isPositiveInteger(value: string): boolean {
    return /^(\+)?([0-9]+)$/.test(value);
}
