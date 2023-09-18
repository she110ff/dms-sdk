import { IClientCore, IClientGraphQLCore, IClientWeb3Core } from "./interfaces/core";
import { Context } from "./context";
import { Web3Module } from "./modules/web3";
import { GraphqlModule } from "./modules/graphql";

const web3Map = new Map<ClientCore, IClientWeb3Core>();
const graphqlMap = new Map<ClientCore, IClientGraphQLCore>();

/**
 * Provides the low level foundation so that subclasses have ready-made access to Web3, IPFS and GraphQL primitives
 */
export abstract class ClientCore implements IClientCore {
    constructor(context: Context) {
        web3Map.set(this, new Web3Module(context));
        graphqlMap.set(this, new GraphqlModule(context));
        Object.freeze(ClientCore.prototype);
    }

    get web3(): IClientWeb3Core {
        return web3Map.get(this)!;
    }
    get graphql(): IClientGraphQLCore {
        return graphqlMap.get(this)!;
    }
}
