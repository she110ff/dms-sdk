import { IClientCore, IClientHttpCore, IClientWeb3Core } from "./interfaces/core";
import { Context } from "./context";
import { Web3Module } from "./modules/web3";
import { HttpModule } from "./modules/http";

const web3Map = new Map<ClientCore, IClientWeb3Core>();
const httpMap = new Map<ClientCore, IClientHttpCore>();
/**
 * Provides the low level foundation so that subclasses have ready-made access to Web3, IPFS and GraphQL primitives
 */
export abstract class ClientCore implements IClientCore {
    constructor(context: Context) {
        web3Map.set(this, new Web3Module(context));
        httpMap.set(this, new HttpModule(context));
        Object.freeze(ClientCore.prototype);
    }

    get web3(): IClientWeb3Core {
        return web3Map.get(this)!;
    }
    get http(): IClientHttpCore {
        return httpMap.get(this)!;
    }
}
