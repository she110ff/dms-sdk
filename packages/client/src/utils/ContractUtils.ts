/**
 *  Includes various useful functions for the solidity
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { defaultAbiCoder } from "@ethersproject/abi";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumberish } from "@ethersproject/bignumber";
import { BytesLike } from "@ethersproject/bytes";
import { arrayify } from "@ethersproject/bytes";
import { keccak256 } from "@ethersproject/keccak256";
import { verifyMessage } from "@ethersproject/wallet";
import { randomBytes } from "@ethersproject/random";

export class ContractUtils {
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
            [hash, address, nonce, randomBytes(32)]
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

    public static getRequestPhone(phone: string, address: string, nonce: BigNumberish): Uint8Array {
        const encodedResult = defaultAbiCoder.encode(
            ["bytes32", "address", "uint256"],
            [ContractUtils.getPhoneHash(phone), address, nonce]
        );
        return arrayify(keccak256(encodedResult));
    }

    public static async signRequestPhone(signer: Signer, phone: string, nonce: BigNumberish): Promise<string> {
        const message = ContractUtils.getRequestPhone(phone, await signer.getAddress(), nonce);
        return signer.signMessage(message);
    }

    public static verifyRequestPhone(
        address: string,
        phone: string,
        nonce: BigNumberish,
        signature: BytesLike
    ): boolean {
        const message = ContractUtils.getRequestPhone(phone, address, nonce);
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

    public static getLoyaltyTypeMessage(account: string, nonce: BigNumberish): Uint8Array {
        const encodedResult = defaultAbiCoder.encode(["address", "uint256"], [account, nonce]);
        return arrayify(keccak256(encodedResult));
    }

    public static async signLoyaltyType(signer: Signer, nonce: BigNumberish): Promise<string> {
        const message = ContractUtils.getLoyaltyTypeMessage(await signer.getAddress(), nonce);
        return signer.signMessage(message);
    }

    public static verifyLoyaltyType(account: string, nonce: BigNumberish, signature: BytesLike): boolean {
        const message = ContractUtils.getLoyaltyTypeMessage(account, nonce);
        let res: string;
        try {
            res = verifyMessage(message, signature);
        } catch (error) {
            return false;
        }
        return res.toLowerCase() === account.toLowerCase();
    }

    public static getShopId(account: string): string {
        const encodedResult = defaultAbiCoder.encode(["address", "bytes32"], [account, randomBytes(32)]);
        return keccak256(encodedResult);
    }

    public static getShopMessage(shopId: BytesLike, account: string, nonce: BigNumberish): Uint8Array {
        const encodedResult = defaultAbiCoder.encode(["bytes32", "address", "uint256"], [shopId, account, nonce]);
        return arrayify(keccak256(encodedResult));
    }

    public static async signShop(signer: Signer, shopId: BytesLike, nonce: BigNumberish): Promise<string> {
        const message = ContractUtils.getShopMessage(shopId, await signer.getAddress(), nonce);
        return signer.signMessage(message);
    }

    public static verifyShop(shopId: BytesLike, nonce: BigNumberish, account: string, signature: BytesLike): boolean {
        const message = ContractUtils.getShopMessage(shopId, account, nonce);
        let res: string;
        try {
            res = verifyMessage(message, signature);
        } catch (error) {
            return false;
        }
        return res.toLowerCase() === account.toLowerCase();
    }

    public static getPaymentId(account: string, nonce: BigNumberish): string {
        const encodedResult = defaultAbiCoder.encode(
            ["address", "uint256", "bytes32"],
            [account, nonce, randomBytes(32)]
        );
        return keccak256(encodedResult);
    }

    public static getLoyaltyNewPaymentMessage(
        address: string,
        paymentId: BytesLike,
        purchaseId: string,
        amount: BigNumberish,
        currency: string,
        shopId: BytesLike,
        nonce: BigNumberish
    ): Uint8Array {
        const encodedResult = defaultAbiCoder.encode(
            ["bytes32", "string", "uint256", "string", "bytes32", "address", "uint256"],
            [paymentId, purchaseId, amount, currency, shopId, address, nonce]
        );
        return arrayify(keccak256(encodedResult));
    }

    public static async signLoyaltyNewPayment(
        signer: Signer,
        paymentId: BytesLike,
        purchaseId: string,
        amount: BigNumberish,
        currency: string,
        shopId: BytesLike,
        nonce: BigNumberish
    ): Promise<string> {
        const message = ContractUtils.getLoyaltyNewPaymentMessage(
            await signer.getAddress(),
            paymentId,
            purchaseId,
            amount,
            currency,
            shopId,
            nonce
        );
        return signer.signMessage(message);
    }

    public static verifyLoyaltyNewPayment(
        paymentId: BytesLike,
        purchaseId: string,
        amount: BigNumberish,
        currency: string,
        shopId: BytesLike,
        nonce: BigNumberish,
        account: string,
        signature: BytesLike
    ): boolean {
        const message = ContractUtils.getLoyaltyNewPaymentMessage(
            account,
            paymentId,
            purchaseId,
            amount,
            currency,
            shopId,
            nonce
        );
        let res: string;
        try {
            res = verifyMessage(message, signature);
        } catch (error) {
            return false;
        }
        return res.toLowerCase() === account.toLowerCase();
    }

    public static getLoyaltyCancelPaymentMessage(
        address: string,
        paymentId: BytesLike,
        purchaseId: string,
        nonce: BigNumberish
    ): Uint8Array {
        const encodedResult = defaultAbiCoder.encode(
            ["bytes32", "string", "address", "uint256"],
            [paymentId, purchaseId, address, nonce]
        );
        return arrayify(keccak256(encodedResult));
    }

    public static async signLoyaltyCancelPayment(
        signer: Signer,
        paymentId: BytesLike,
        purchaseId: string,
        nonce: BigNumberish
    ): Promise<string> {
        const message = ContractUtils.getLoyaltyCancelPaymentMessage(
            await signer.getAddress(),
            paymentId,
            purchaseId,
            nonce
        );
        return signer.signMessage(message);
    }
    public static verifyLoyaltyCancelPayment(
        paymentId: BytesLike,
        purchaseId: string,
        nonce: BigNumberish,
        account: string,
        signature: BytesLike
    ): boolean {
        const message = ContractUtils.getLoyaltyCancelPaymentMessage(account, paymentId, purchaseId, nonce);
        let res: string;
        try {
            res = verifyMessage(message, signature);
        } catch (error) {
            return false;
        }
        return res.toLowerCase() === account.toLowerCase();
    }

    public static getTaskId(shopId: BytesLike): string {
        const encodedResult = defaultAbiCoder.encode(
            ["bytes32", "uint256", "bytes32", "bytes32"],
            [shopId, ContractUtils.getTimeStamp(), randomBytes(32), randomBytes(32)]
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
