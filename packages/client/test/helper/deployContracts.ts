import { GanacheServer } from "./GanacheServer";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { Contract, ContractFactory } from "@ethersproject/contracts";
import { JsonRpcProvider, JsonRpcSigner } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";
import {
    ShopCollection,
    ShopCollection__factory,
    Ledger,
    Ledger__factory,
    Token,
    Token__factory,
    TokenPrice,
    TokenPrice__factory,
    ValidatorCollection,
    ValidatorCollection__factory
} from "dms-osx-lib";
import { Amount, ContractUtils } from "../../src";
import { LinkCollection, LinkCollection__factory } from "del-osx-lib";

export interface Deployment {
    provider: JsonRpcProvider;
    linkCollection: LinkCollection;
    token: Token;
    validatorCollection: ValidatorCollection;
    tokenPrice: TokenPrice;
    shopCollection: ShopCollection;
    ledger: Ledger;
}

export const depositAmount = Amount.make(50_000, 18);
export const foundationAmount = Amount.make(1_000_000_000, 18);
export const foundationEmail = "foundation@example.com";
export const foundationAccount = ContractUtils.sha256String(foundationEmail);

export async function deployAll(provider: JsonRpcProvider): Promise<Deployment> {
    let accounts = GanacheServer.accounts();
    const [deployer, foundation, validator1, validator2, validator3] = accounts;
    const validators = [validator1, validator2, validator3];

    try {
        const tokenContract = await deployToken(deployer, accounts);

        const validatorCollectionContract: ValidatorCollection = (await deployValidatorCollection(
            deployer,
            tokenContract,
            validators
        )) as ValidatorCollection;

        await depositValidators(tokenContract, validatorCollectionContract, validators);
        const linkCollectionContract: LinkCollection = await deployLinkCollection(deployer, validators);

        const tokenPriceContract: TokenPrice = await deployTokenPrice(
            deployer,
            validatorCollectionContract,
            validator1
        );
        const shopCollectionContract: ShopCollection = await deployShopCollection(
            deployer,
            validatorCollectionContract
        );
        const ledgerContract: Ledger = await deployLedger(
            deployer,
            foundationAccount,
            tokenContract,
            validatorCollectionContract,
            linkCollectionContract,
            tokenPriceContract,
            shopCollectionContract
        );
        await depositFoundationAsset(
            tokenContract,
            ledgerContract,
            linkCollectionContract,
            deployer,
            foundation,
            validators
        );

        return {
            provider: provider,
            linkCollection: linkCollectionContract,
            token: tokenContract,
            validatorCollection: validatorCollectionContract,
            tokenPrice: tokenPriceContract,
            shopCollection: shopCollectionContract,
            ledger: ledgerContract
        };
    } catch (e) {
        throw e;
    }
}

async function deployToken(deployer: Wallet, accounts: Wallet[]): Promise<Token> {
    const tokenFactory = new ContractFactory(Token__factory.abi, Token__factory.bytecode);
    const tokenContract = (await tokenFactory
        .connect(deployer)
        .deploy(await deployer.getAddress(), "Sample", "SAM")) as Token;
    await tokenContract.deployed();
    await tokenContract.deployTransaction.wait();

    for (const elem of accounts) {
        await tokenContract.connect(deployer).transfer(await elem.getAddress(), depositAmount.value);
    }
    return tokenContract;
}

async function deployValidatorCollection(
    deployer: Wallet,
    tokenContract: Token,
    validators: Wallet[]
): Promise<ValidatorCollection> {
    const validatorFactory = new ContractFactory(
        ValidatorCollection__factory.abi,
        ValidatorCollection__factory.bytecode
    );
    const validatorContract: ValidatorCollection = (await validatorFactory.connect(deployer).deploy(
        tokenContract.address,
        validators.map((m) => m.address)
    )) as ValidatorCollection;
    await validatorContract.deployed();
    await validatorContract.deployTransaction.wait();
    return validatorContract;
}

async function depositValidators(
    tokenContract: Contract,
    validatorContract: ValidatorCollection,
    validators: Wallet[]
): Promise<void> {
    for (const elem of validators) {
        const token = tokenContract.connect(elem);
        const address = await elem.getAddress();
        const tx1 = await token.approve(validatorContract.address, depositAmount.value);
        await tx1.wait();
        const tx2 = await validatorContract.connect(elem).deposit(depositAmount.value);
        await tx2.wait();
        await validatorContract.validatorOf(address);
    }
    await validatorContract.connect(validators[0]).makeActiveItems();
}

const deployLinkCollection = async (deployer: Wallet, validators: Wallet[]): Promise<LinkCollection> => {
    const linkCollectionFactory = new ContractFactory(LinkCollection__factory.abi, LinkCollection__factory.bytecode);
    const linkCollectionContract: LinkCollection = (await linkCollectionFactory
        .connect(deployer)
        .deploy(validators.map((m) => m.address))) as LinkCollection;
    await linkCollectionContract.deployed();
    await linkCollectionContract.deployTransaction.wait();

    return linkCollectionContract;
};

async function deployTokenPrice(
    deployer: Signer,
    validatorContract: ValidatorCollection,
    validator: Signer
): Promise<TokenPrice> {
    const tokenPriceFactory = new ContractFactory(TokenPrice__factory.abi, TokenPrice__factory.bytecode);
    const tokenPriceContract = (await tokenPriceFactory
        .connect(deployer)
        .deploy(validatorContract.address)) as TokenPrice;
    await tokenPriceContract.deployed();
    await tokenPriceContract.deployTransaction.wait();

    const multiple = BigNumber.from(1000000000);
    const price = BigNumber.from(150).mul(multiple);
    await tokenPriceContract.connect(validator).set("KRW", price);
    return tokenPriceContract;
}

async function deployShopCollection(deployer: Signer, validatorContract: ValidatorCollection): Promise<ShopCollection> {
    const shopCollectionFactory = new ContractFactory(ShopCollection__factory.abi, ShopCollection__factory.bytecode);
    const shopCollection = (await shopCollectionFactory
        .connect(deployer)
        .deploy(validatorContract.address)) as ShopCollection;
    await shopCollection.deployed();
    await shopCollection.deployTransaction.wait();
    return shopCollection;
}

const deployLedger = async (
    deployer: Signer,
    foundationAccount: string,
    tokenContract: Contract,
    validatorContract: Contract,
    linkCollectionContract: Contract,
    tokenPriceContract: Contract,
    shopCollection: Contract
): Promise<Ledger> => {
    const ledgerFactory = new ContractFactory(Ledger__factory.abi, Ledger__factory.bytecode);
    const ledgerContract = (await ledgerFactory
        .connect(deployer)
        .deploy(
            foundationAccount,
            tokenContract.address,
            validatorContract.address,
            linkCollectionContract.address,
            tokenPriceContract.address,
            shopCollection.address
        )) as Ledger;
    await ledgerContract.deployed();
    await ledgerContract.deployTransaction.wait();
    await shopCollection.connect(deployer).setLedgerAddress(ledgerContract.address);
    return ledgerContract;
};

async function depositFoundationAsset(
    tokenContract: Token,
    ledgerContract: Ledger,
    linkContract: LinkCollection,
    deployer: Wallet,
    foundation: Wallet,
    validators: Wallet[]
): Promise<void> {
    const nonce = await linkContract.nonceOf(foundation.address);
    const signature = await ContractUtils.sign(foundation, foundationAccount, nonce);
    const requestId = ContractUtils.getRequestId(foundationAccount, foundation.address, nonce);
    await linkContract.connect(validators[0]).addRequest(requestId, foundationAccount, foundation.address, signature);
    await linkContract.connect(validators[0]).voteRequest(requestId);
    await linkContract.connect(validators[1]).voteRequest(requestId);
    await linkContract.connect(validators[2]).voteRequest(requestId);
    await linkContract.connect(validators[1]).countVote(requestId);

    await tokenContract.connect(deployer).transfer(foundation.address, foundationAmount.value);
    await tokenContract.connect(foundation).approve(ledgerContract.address, foundationAmount.value);
    await ledgerContract.connect(foundation).deposit(foundationAmount.value);
}

export const getSigners = (provider: JsonRpcProvider): JsonRpcSigner[] => {
    let accounts: JsonRpcSigner[] = [];
    for (let idx = 0; idx < 7; idx++) {
        const p = provider.getSigner(idx);
        accounts.push(p);
    }
    return accounts;
};

export const getSignersToAddress = async (singers: JsonRpcSigner[]): Promise<string[]> => {
    let accounts = [];
    for (let idx = 0; idx < singers.length; idx++) {
        const signer = singers[idx];
        const address = await signer.getAddress();
        accounts.push(address);
    }
    return accounts;
};

export function delay(interval: number): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, interval);
    });
}

export interface PurchaseData {
    purchaseId: string;
    timestamp: number;
    amount: number;
    userEmail: string;
    shopId: string;
    method: number;
}

export const purchaseData: PurchaseData[] = [
    {
        purchaseId: "P000001",
        timestamp: 1672844400,
        amount: 10000,
        userEmail: "a@example.com",
        shopId: "F000100",
        method: 0
    },
    {
        purchaseId: "P000002",
        timestamp: 1675522800,
        amount: 10000,
        userEmail: "b@example.com",
        shopId: "F000100",
        method: 0
    },
    {
        purchaseId: "P000003",
        timestamp: 1677942000,
        amount: 10000,
        userEmail: "c@example.com",
        shopId: "F000200",
        method: 0
    },
    {
        purchaseId: "P000004",
        timestamp: 1680620400,
        amount: 10000,
        userEmail: "d@example.com",
        shopId: "F000300",
        method: 0
    },
    {
        purchaseId: "P000005",
        timestamp: 1683212400,
        amount: 10000,
        userEmail: "a@example.com",
        shopId: "F000200",
        method: 0
    }
];
