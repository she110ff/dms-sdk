import { ClientCore, Context } from "./client-common";
import { ILedger, ILedgerMethods } from "./interface/ILedger";
import { LedgerMethods } from "./internal/client/LedgerMethods";
import { CurrencyMethods } from "./internal/client/CurrencyMethods";
import { ICurrency, ICurrencyMethods } from "./interface/ICurrency";

/**
 * Provider a generic client with high level methods to manage and interact
 */
export class Client extends ClientCore implements ILedger, ICurrency {
    private readonly privateLedger: ILedgerMethods;
    private readonly privateCurrency: ICurrencyMethods;

    constructor(context: Context) {
        super(context);
        this.privateLedger = new LedgerMethods(context);
        this.privateCurrency = new CurrencyMethods(context);
        Object.freeze(Client.prototype);
        Object.freeze(this);
    }

    public get ledger(): ILedgerMethods {
        return this.privateLedger;
    }

    public get currency(): ICurrencyMethods {
        return this.privateCurrency;
    }
}
