import { ClientCore, Context, IClientHttpCore } from "./client-common";
import { IClient, IClientMethods } from "./interface/IClient";
import { ClientMethods } from "./internal/client/methods";
import { HttpModule } from "./client-common/modules/http";

/**
 * Provider a generic client with high level methods to manage and interact
 */
export class Client extends ClientCore implements IClient {
    private privateMethods: IClientMethods;
    private privateHttp: IClientHttpCore;

    constructor(context: Context) {
        super(context);
        this.privateMethods = new ClientMethods(context);
        this.privateHttp = new HttpModule(context);
        Object.freeze(Client.prototype);
        Object.freeze(this);
    }
    public get methods(): IClientMethods {
        return this.privateMethods;
    }
    public get http(): IClientHttpCore {
        return this.privateHttp;
    }
}
