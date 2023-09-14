import { GanacheServer } from "./GanacheServer";
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumber } from "@ethersproject/bignumber";
import { Contract, ContractFactory } from "@ethersproject/contracts";
import { JsonRpcProvider, JsonRpcSigner } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";
import {
    FranchiseeCollection,
    FranchiseeCollection__factory,
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
    franchiseeCollection: FranchiseeCollection;
    ledger: Ledger;
}

export const depositAmount = Amount.make(50_000, 18);
export const foundationEmail = "foundation@example.com";
export const foundationAccount = ContractUtils.sha256String(foundationEmail);

export async function deployAll(provider: JsonRpcProvider): Promise<Deployment> {
    let accounts = GanacheServer.accounts();
    const [deployer, , validator1, validator2, validator3] = accounts;
    const validators = [validator1, validator2, validator3];
    const validatorsAddress: string[] = validators.map((m) => m.address);

    try {
        const tokenContract = await deployToken(deployer, accounts);
        const validatorCollectionContract: ValidatorCollection = (await deployValidatorCollection(
            deployer,
            tokenContract,
            validatorsAddress
        )) as ValidatorCollection;
        await depositValidators(tokenContract, validatorCollectionContract, validators);
        const linkCollectionContract: LinkCollection = await deployLinkCollection(deployer, validatorsAddress);
        const tokenPriceContract: TokenPrice = await deployTokenPrice(
            deployer,
            validatorCollectionContract,
            validator1
        );
        const franchiseeCollectionContract: FranchiseeCollection = await deployFranchiseeCollection(
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
            franchiseeCollectionContract
        );
        return {
            provider: provider,
            linkCollection: linkCollectionContract,
            token: tokenContract,
            validatorCollection: validatorCollectionContract,
            tokenPrice: tokenPriceContract,
            franchiseeCollection: franchiseeCollectionContract,
            ledger: ledgerContract
        };
    } catch (e) {
        throw e;
    }
}

export const deployToken = async (deployer: Signer, accounts: Wallet[]): Promise<Token> => {
    const tokenFactory = new ContractFactory(Token__factory.abi, Token__factory.bytecode);
    const tokenContract = (await tokenFactory.connect(deployer).deploy("Sample", "SAM")) as Token;
    await tokenContract.deployed();
    await tokenContract.deployTransaction.wait();
    for (const elem of accounts) {
        await tokenContract.connect(deployer).transfer(await elem.getAddress(), depositAmount.value);
    }
    return tokenContract;
};

export const deployValidatorCollection = async (
    deployer: Signer,
    tokenContract: Token,
    validators: any[]
): Promise<ValidatorCollection> => {
    const validatorFactory = new ContractFactory(
        ValidatorCollection__factory.abi,
        ValidatorCollection__factory.bytecode
    );
    const validatorContract: ValidatorCollection = (await validatorFactory
        .connect(deployer)
        .deploy(tokenContract.address, validators)) as ValidatorCollection;
    await validatorContract.deployed();
    await validatorContract.deployTransaction.wait();
    return validatorContract;
};

export const depositValidators = async (
    tokenContract: Contract,
    validatorContract: ValidatorCollection,
    validators: Signer[]
): Promise<void> => {
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
};

export const deployLinkCollection = async (deployer: Signer, validators: String[]): Promise<LinkCollection> => {
    const linkCollectionFactory = new ContractFactory(LinkCollection__factory.abi, LinkCollection__factory.bytecode);
    const linkCollectionContract: LinkCollection = (await linkCollectionFactory
        .connect(deployer)
        .deploy(validators)) as LinkCollection;
    await linkCollectionContract.deployed();
    await linkCollectionContract.deployTransaction.wait();
    return linkCollectionContract;
};

export const deployTokenPrice = async (
    deployer: Signer,
    validatorContract: ValidatorCollection,
    validator: Signer
): Promise<TokenPrice> => {
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
};

export const deployFranchiseeCollection = async (
    deployer: Signer,
    validatorContract: ValidatorCollection
): Promise<FranchiseeCollection> => {
    const franchiseeCollectionFactory = new ContractFactory(
        FranchiseeCollection__factory.abi,
        FranchiseeCollection__factory.bytecode
    );
    const franchiseeCollection = (await franchiseeCollectionFactory
        .connect(deployer)
        .deploy(validatorContract.address)) as FranchiseeCollection;
    await franchiseeCollection.deployed();
    await franchiseeCollection.deployTransaction.wait();
    return franchiseeCollection;
};

export const deployLedger = async (
    deployer: Signer,
    foundationAccount: string,
    tokenContract: Contract,
    validatorContract: Contract,
    linkCollectionContract: Contract,
    tokenPriceContract: Contract,
    franchiseeCollection: Contract
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
            franchiseeCollection.address
        )) as Ledger;
    await ledgerContract.deployed();
    await ledgerContract.deployTransaction.wait();
    await franchiseeCollection.connect(deployer).setLedgerAddress(ledgerContract.address);
    return ledgerContract;
};

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
    franchiseeId: string;
    method: number;
}

export const purchaseData: PurchaseData[] = [
    {
        purchaseId: "P000001",
        timestamp: 1672844400,
        amount: 10000,
        userEmail: "a@example.com",
        franchiseeId: "F000100",
        method: 0
    },
    {
        purchaseId: "P000002",
        timestamp: 1675522800,
        amount: 10000,
        userEmail: "b@example.com",
        franchiseeId: "F000100",
        method: 0
    },
    {
        purchaseId: "P000003",
        timestamp: 1677942000,
        amount: 10000,
        userEmail: "c@example.com",
        franchiseeId: "F000200",
        method: 0
    },
    {
        purchaseId: "P000004",
        timestamp: 1680620400,
        amount: 10000,
        userEmail: "d@example.com",
        franchiseeId: "F000300",
        method: 0
    },
    {
        purchaseId: "P000005",
        timestamp: 1683212400,
        amount: 10000,
        userEmail: "a@example.com",
        franchiseeId: "F000200",
        method: 0
    }
];
