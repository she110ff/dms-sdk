import { JsonRpcProvider } from "@ethersproject/providers";
import { Signer } from "@ethersproject/abstract-signer";
import { ContractFactory } from "@ethersproject/contracts";
import { Token, Token__factory } from "dms-osx-lib";
import { Amount } from "../../src";

export interface Deployment {
    linkCollection: string;
    token: string;
    validatorCollection: string;
    tokenPrice: string;
    franchiseeCollection: string;
    ledger: string;
}

export async function deploy(): Promise<Deployment> {
    const provider = new JsonRpcProvider("http://127.0.0.1:8545");
    const deployOwnerWallet = provider.getSigner();

    console.log(deployOwnerWallet.getAddress());

    try {
        return {
            linkCollection: "",
            token: "",
            validatorCollection: "",
            tokenPrice: "",
            franchiseeCollection: "",
            ledger: ""
        };
    } catch (e) {
        throw e;
    }
}

export const deployToken = async (deployOwnerWallet: Signer) => {
    const amount = Amount.make(50_000, 18);
    const tokenFactory = new ContractFactory(Token__factory.abi, Token__factory.bytecode);
    const tokenContract = (await tokenFactory.connect(deployOwnerWallet).deploy("Sample", "SAM")) as Token;
    await tokenContract.deployed();
    await tokenContract.deployTransaction.wait();
    // TODO add validator wallet array
    for (const elem of []) {
        await tokenContract.connect(deployOwnerWallet).transfer(elem.address, amount.value);
    }
};

// async function deployEnsContracts(deployOwnerWallet: Signer) {
//     try {
//         const registryFactory = new ContractFactory(ENSRegistry.abi, ENSRegistry.bytecode);
//         const publicResolverFactory = new ContractFactory(PublicResolver.abi, PublicResolver.bytecode);
//
//         const registry = await registryFactory.connect(deployOwnerWallet).deploy();
//         await registry.deployed();
//
//         const publicResolver = await publicResolverFactory
//             .connect(deployOwnerWallet)
//             .deploy(registry.address, AddressZero, AddressZero, AddressZero);
//         await publicResolver.deployed();
//
//         await registerEnsName("", "eth", registry, await deployOwnerWallet.getAddress(), publicResolver.address);
//         return { ensRegistry: registry, ensResolver: publicResolver };
//     } catch (e) {
//         throw e;
//     }
// }
//
// export async function registerEnsName(tld: string, name: string, registry: Contract, owner: string, resolver: string) {
//     try {
//         await registry.setSubnodeRecord(tld !== "" ? namehash(tld) : HashZero, id(name), owner, resolver, 0);
//     } catch (e) {
//         throw e;
//     }
// }

// export async function createDAO(
//     daoFactory: aragonContracts.DAOFactory,
//     daoSettings: aragonContracts.DAOFactory.DAOSettingsStruct,
//     pluginSettings: aragonContracts.DAOFactory.PluginSettingsStruct[]
// ): Promise<{ daoAddr: string; pluginAddrs: string[] }> {
//     const tx = await daoFactory.createDao(daoSettings, pluginSettings);
//     const receipt = await tx.wait();
//     const registryInterface = aragonContracts.DAORegistry__factory.createInterface();
//     const registeredLog = receipt.logs.find(
//         (log) => log.topics[0] === id(registryInterface.getEvent("DAORegistered").format("sighash"))
//     );
//
//     const pluginSetupProcessorInterface = aragonContracts.PluginSetupProcessor__factory.createInterface();
//     const installedLogs = receipt.logs.filter(
//         (log) => log.topics[0] === id(pluginSetupProcessorInterface.getEvent("InstallationApplied").format("sighash"))
//     );
//     if (!registeredLog) {
//         throw new Error("Failed to find log");
//     }
//
//     const registeredParsed = registryInterface.parseLog(registeredLog);
//     return {
//         daoAddr: registeredParsed.args[0],
//         pluginAddrs: installedLogs.map((log) => pluginSetupProcessorInterface.parseLog(log).args[1])
//     };
// }
//
// export async function createAddresslistDAO(
//     deployment: Deployment,
//     name: string,
//     votingMode: VotingMode,
//     addresses: string[] = []
// ) {
//     const latestVersion = await deployment.addresslistVotingRepo["getLatestVersion(address)"](
//         deployment.addresslistVotingPluginSetup.address
//     );
//
//     const dummyMetadata = {
//         metadata: "0x",
//         subdomain: name,
//         trustedForwarder: AddressZero,
//         daoURI: "0x"
//     };
//
//     const pluginItem = AddresslistVotingClient.encoding.getPluginInstallItem({
//         addresses,
//         votingSettings: {
//             minDuration: 60 * 60, // 1h
//             minParticipation: 0.5,
//             supportThreshold: 0.5,
//             votingMode,
//             minProposerVotingPower: BigInt(0)
//         }
//     });
//
//     const pluginInstallItems = [
//         {
//             pluginSetupRef: {
//                 pluginSetupRepo: latestVersion.pluginSetup,
//                 versionTag: latestVersion.tag
//             },
//             data: pluginItem.data
//         }
//     ];
//     return createDAO(deployment.daoFactory, dummyMetadata, pluginInstallItems);
//
//     // try {
//     //   const addr = await createDAO(
//     //     deployment.daoFactory,
//     //     {
//     //       metadata: "0x",
//     //       name: name,
//     //       trustedForwarder: AddressZero,
//     //       daoURI: "0x",
//     //     },
//     //     [
//     //       {
//     //         pluginSetupRef: {
//     //           pluginSetupRepo: latestVersion.pluginSetup,
//     //           versionTag: latestVersion.tag,
//     //         },
//     //         data: defaultAbiCoder.encode(
//     //           [
//     //             // VotingSettings
//     //             "tuple(uint8 votingMode, uint64 supportThreshold, uint64 minParticipation, uint64 minDuration, uint256 minProposerVotingPower) votingSettings",
//     //             "address[] members",
//     //           ],
//     //           [
//     //             [votingModeToContracts(votingMode), 500000, 500000, 3600, 1],
//     //             addresses,
//     //           ],
//     //         ),
//     //       },
//     //     ],
//     //   );
//     //   return addr;
//     // } catch (e) {
//     //   console.log("CANNOT CREATE ADDRESS LIST DAO", e);
//     //   throw e;
//     // }
// }
