import { Context } from "./client-common";
import { ClientMethods } from "./internal/client/methods";
import { ClientCore } from "./client-common";
import { IClient, IClientMethods } from "./interface/IClient";

/**
 * Provider a generic client with high level methods to manage and interact
 */
export class Client extends ClientCore implements IClient {
    private privateMethods: IClientMethods;

    constructor(context: Context) {
        super(context);
        this.privateMethods = new ClientMethods(context);
        Object.freeze(Client.prototype);
        Object.freeze(this);
    }
    get methods(): IClientMethods {
        return this.privateMethods;
    }
}
