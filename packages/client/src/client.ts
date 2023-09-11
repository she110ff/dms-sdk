import { ClientCore, Context } from "./client-common";
import { IClient, IClientMethods } from "./interface/IClient";
import { ClientMethods } from "./internal/client/methods";

/**
 * Provider a generic client with high level methods to manage and interact
 */
export class Client extends ClientCore implements IClient {
    private readonly privateMethods: IClientMethods;

    constructor(context: Context) {
        super(context);
        this.privateMethods = new ClientMethods(context);
        Object.freeze(Client.prototype);
        Object.freeze(this);
    }
    public get methods(): IClientMethods {
        return this.privateMethods;
    }
}
