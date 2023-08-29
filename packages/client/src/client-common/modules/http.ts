import { FetchExchangeMileageToTokenParams, FetchExchangeTokenToMileageParams, FetchPayOption } from "../../interfaces";
import { Context } from "../context";
import { IClientHttpCore } from "../interfaces/core";
import { Network } from "../interfaces/network";

export class HttpModule implements IClientHttpCore {
    public readonly url: URL;
    public readonly headers: Record<string, string>;

    constructor(context: Context) {
        const endpoint = context.relayEndpoint;
        const newUrl = typeof endpoint === "string" ? new URL(endpoint) : endpoint;
        if (newUrl && !newUrl?.pathname.endsWith("/")) {
            newUrl.pathname += "/";
        }
        this.url = newUrl || new URL("http://localhost:7070");
        this.headers = {};
    }

    public fetchPayMileage(param: FetchPayOption): Promise<any> {
        return Network.post(this, "payMileage", param);
    }

    public fetchPayToken(param: FetchPayOption): Promise<any> {
        return Network.post(this, "payToken", param);
    }

    public fetchExchangeMileageToTokenTo(param: FetchExchangeMileageToTokenParams): Promise<any> {
        return Network.post(this, "exchangeMileageToToken", param);
    }

    public fetchExchangeTokenToMileage(param: FetchExchangeTokenToMileageParams): Promise<any> {
        return Network.post(this, "exchangeTokenToMileage", param);
    }

    public async isUp(): Promise<boolean> {
        try {
            const res = await Network.get(this, "/");
            return res === "OK";
        } catch {
            return false;
        }
    }

    public getEndpoint(): URL | undefined {
        return this.url;
    }
}
