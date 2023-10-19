import { ClientCore, Context } from "./client-common";
import { ILedger, ILedgerMethods } from "./interface/ILedger";
import { LedgerMethods } from "./internal/client/LedgerMethods";
import { CurrencyMethods } from "./internal/client/CurrencyMethods";
import { ICurrency, ICurrencyMethods } from "./interface/ICurrency";
import { IShop, IShopMethods } from "./interface/IShop";
import { ShopMethods } from "./internal/client/ShopMethods";

/**
 * Provider a generic client with high level methods to manage and interact
 */
export class Client extends ClientCore implements ILedger, ICurrency, IShop {
    private readonly privateLedger: ILedgerMethods;
    private readonly privateCurrency: ICurrencyMethods;
    private readonly privateShop: IShopMethods;

    constructor(context: Context) {
        super(context);
        this.privateLedger = new LedgerMethods(context);
        this.privateCurrency = new CurrencyMethods(context);
        this.privateShop = new ShopMethods(context);
        Object.freeze(Client.prototype);
        Object.freeze(this);
    }

    public get ledger(): ILedgerMethods {
        return this.privateLedger;
    }

    public get currency(): ICurrencyMethods {
        return this.privateCurrency;
    }

    public get shop(): IShopMethods {
        return this.privateShop;
    }
}
