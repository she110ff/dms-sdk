/**
 *  Includes various useful functions for the solidity
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import * as crypto from "crypto";
import { defaultAbiCoder } from "@ethersproject/abi";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumberish } from "@ethersproject/bignumber";
import { BytesLike } from "@ethersproject/bytes";
import { arrayify } from "@ethersproject/bytes";
import { keccak256 } from "@ethersproject/keccak256";
import { verifyMessage } from "@ethersproject/wallet";

export class ContractUtils {
    /**
     * It generates hash values.
     * @param data The source data
     */
    public static sha256(data: Buffer): Buffer {
        return crypto
            .createHash("sha256")
            .update(data)
            .digest();
    }

    public static sha256String(data: string): string {
        return ContractUtils.BufferToString(
            crypto
                .createHash("sha256")
                .update(Buffer.from(data.trim()))
                .digest()
        );
    }

    /**
     * Convert hexadecimal strings into Buffer.
     * @param hex The hexadecimal string
     */
    public static StringToBuffer(hex: string): Buffer {
        const start = hex.substring(0, 2) === "0x" ? 2 : 0;
        return Buffer.from(hex.substring(start), "hex");
    }

    /**
     * Convert Buffer into hexadecimal strings.
     * @param data The data
     */
    public static BufferToString(data: Buffer): string {
        return "0x" + data.toString("hex");
    }

    public static getTimeStamp(): number {
        return Math.floor(new Date().getTime() / 1000);
    }

    public static delay(interval: number): Promise<void> {
        return new Promise<void>((resolve, _) => {
            setTimeout(resolve, interval);
        });
    }

    public static cacheEVMError(error: IEVMError): string {
        while (error.error !== undefined) error = error.error;
        return error.data.reason;
    }

    public static getPhoneHash(phone: string): string {
        const encodedResult = defaultAbiCoder.encode(["string", "string"], ["BOSagora Phone Number", phone]);
        return keccak256(encodedResult);
    }

    public static getEmailHash(phone: string): string {
        const encodedResult = defaultAbiCoder.encode(["string", "string"], ["BOSagora Email", phone]);
        return keccak256(encodedResult);
    }

    public static getRequestId(hash: BytesLike, address: string, nonce: BigNumberish): string {
        const encodedResult = defaultAbiCoder.encode(
            ["bytes32", "address", "uint256", "bytes32"],
            [hash, address, nonce, crypto.randomBytes(32)]
        );
        return keccak256(encodedResult);
    }

    public static getRequestHash(hash: BytesLike, address: string, nonce: BigNumberish): Uint8Array {
        const encodedResult = defaultAbiCoder.encode(["bytes32", "address", "uint256"], [hash, address, nonce]);
        return arrayify(keccak256(encodedResult));
    }

    public static async signRequestHash(signer: Signer, hash: BytesLike, nonce: BigNumberish): Promise<string> {
        const message = ContractUtils.getRequestHash(hash, await signer.getAddress(), nonce);
        return signer.signMessage(message);
    }

    public static verifyRequestHash(
        address: string,
        hash: BytesLike,
        nonce: BigNumberish,
        signature: BytesLike
    ): boolean {
        const message = ContractUtils.getRequestHash(hash, address, nonce);
        let res: string;
        try {
            res = verifyMessage(message, signature);
        } catch (error) {
            return false;
        }
        return res.toLowerCase() === address.toLowerCase();
    }

    public static getPaymentMessage(
        account: string,
        purchaseId: string,
        amount: BigNumberish,
        currency: string,
        shopId: BytesLike,
        nonce: BigNumberish
    ): Uint8Array {
        const encodedResult = defaultAbiCoder.encode(
            ["string", "uint256", "string", "bytes32", "address", "uint256"],
            [purchaseId, amount, currency, shopId, account, nonce]
        );
        return arrayify(keccak256(encodedResult));
    }

    public static async signPayment(
        signer: Signer,
        purchaseId: string,
        amount: BigNumberish,
        currency: string,
        shopId: BytesLike,
        nonce: BigNumberish
    ): Promise<string> {
        const message = ContractUtils.getPaymentMessage(
            await signer.getAddress(),
            purchaseId,
            amount,
            currency,
            shopId,
            nonce
        );
        return signer.signMessage(message);
    }

    public static verifyPayment(
        purchaseId: string,
        amount: BigNumberish,
        currency: string,
        shopId: string,
        account: string,
        nonce: BigNumberish,
        signature: BytesLike
    ): boolean {
        const message = ContractUtils.getPaymentMessage(account, purchaseId, amount, currency, shopId, nonce);
        let res: string;
        try {
            res = verifyMessage(message, signature);
        } catch (error) {
            return false;
        }
        return res.toLowerCase() === account.toLowerCase();
    }

    public static getChangePayablePointMessage(phone: BytesLike, address: string, nonce: BigNumberish): Uint8Array {
        const encodedResult = defaultAbiCoder.encode(["bytes32", "address", "uint256"], [phone, address, nonce]);
        return arrayify(keccak256(encodedResult));
    }

    public static async signChangePayablePoint(signer: Signer, phone: BytesLike, nonce: BigNumberish): Promise<string> {
        const message = ContractUtils.getChangePayablePointMessage(phone, await signer.getAddress(), nonce);
        return signer.signMessage(message);
    }

    public static verifyChangePayablePoint(
        phone: BytesLike,
        account: string,
        nonce: BigNumberish,
        signature: BytesLike
    ): boolean {
        const message = ContractUtils.getChangePayablePointMessage(phone, account, nonce);
        let res: string;
        try {
            res = verifyMessage(message, signature);
        } catch (error) {
            return false;
        }
        return res.toLowerCase() === account.toLowerCase();
    }

    public static getPointTypeMessage(type: BigNumberish, account: string, nonce: BigNumberish): Uint8Array {
        const encodedResult = defaultAbiCoder.encode(["uint256", "address", "uint256"], [type, account, nonce]);
        return arrayify(keccak256(encodedResult));
    }

    public static async signPointType(signer: Signer, type: BigNumberish, nonce: BigNumberish): Promise<string> {
        const message = ContractUtils.getPointTypeMessage(type, await signer.getAddress(), nonce);
        return signer.signMessage(message);
    }

    public static verifyPointType(
        type: BigNumberish,
        account: string,
        nonce: BigNumberish,
        signature: BytesLike
    ): boolean {
        const message = ContractUtils.getPointTypeMessage(type, account, nonce);
        let res: string;
        try {
            res = verifyMessage(message, signature);
        } catch (error) {
            return false;
        }
        return res.toLowerCase() === account.toLowerCase();
    }

    public static getShopId(name: string, account: string): string {
        const encodedResult = defaultAbiCoder.encode(
            ["string", "address", "bytes32"],
            [name, account, crypto.randomBytes(32)]
        );
        return keccak256(encodedResult);
    }
}

interface IEVMError {
    error?: IEVMError;
    data: {
        reason: string;
    };
}
