import { ContextParams, ContextState } from "./interfaces/context";
import { JsonRpcProvider, Networkish } from "@ethersproject/providers";
import { UnsupportedProtocolError } from "dms-sdk-common";

export { ContextParams } from "./interfaces/context";

const supportedProtocols = ["https:"];
if (typeof process !== "undefined" && process.env?.TESTING) {
    supportedProtocols.push("http:");
}

// State
const defaultState: ContextState = {
    network: "mainnet",
    web3Providers: []
};

export class Context {
    protected state: ContextState = Object.assign({}, defaultState);
    // INTERNAL CONTEXT STATE

    /**
     * @param {Object} params
     *
     * @constructor
     */
    constructor(params: Partial<ContextParams>) {
        this.set(params);
    }

    /**
     * Does set and parse the given context configuration object
     *
     * @returns {void}
     *
     * @private
     */
    setFull(contextParams: ContextParams): void {
        if (!contextParams.network) {
            throw new Error("Missing network");
        } else if (!contextParams.signer) {
            throw new Error("Please pass the required signer");
        } else if (!contextParams.web3Providers) {
            throw new Error("No web3 endpoints defined");
        }

        this.state = {
            network: contextParams.network,
            signer: contextParams.signer,
            web3Providers: Context.resolveWeb3Providers(contextParams.web3Providers, contextParams.network)
        };
    }

    set(contextParams: Partial<ContextParams>) {
        if (contextParams.network) {
            this.state.network = contextParams.network;
        }
        if (contextParams.signer) {
            this.state.signer = contextParams.signer;
        }
        if (contextParams.web3Providers) {
            this.state.web3Providers = Context.resolveWeb3Providers(contextParams.web3Providers, this.state.network);
        }
        if (contextParams.relayEndpoint) {
            this.state.relayEndpoint = contextParams.relayEndpoint;
        }
    }
    // GETTERS

    /**
     * Getter for the network
     *
     * @var network
     *
     * @returns {Networkish}
     *
     * @public
     */
    get network() {
        return this.state.network || defaultState.network;
    }

    /**
     * Getter for the Signer
     *
     * @var signer
     *
     * @returns {Signer}
     *
     * @public
     */
    get signer() {
        return this.state.signer || defaultState.signer;
    }

    /**
     * Getter for the web3 providers
     *
     * @var web3Providers
     *
     * @returns {JsonRpcProvider[]}
     *
     * @public
     */
    get web3Providers() {
        return this.state.web3Providers || defaultState.web3Providers;
    }

    get relayEndpoint() {
        return this.state.relayEndpoint || defaultState.relayEndpoint;
    }

    // DEFAULT CONTEXT STATE
    static setDefault(params: Partial<ContextParams>) {
        if (params.signer) {
            defaultState.signer = params.signer;
        }
    }
    static getDefault() {
        return defaultState;
    }

    private static resolveWeb3Providers(
        endpoints: string | JsonRpcProvider | (string | JsonRpcProvider)[],
        network: Networkish
    ): JsonRpcProvider[] {
        if (Array.isArray(endpoints)) {
            return endpoints.map((item) => {
                if (typeof item === "string") {
                    const url = new URL(item);
                    if (!supportedProtocols.includes(url.protocol)) {
                        throw new UnsupportedProtocolError(url.protocol);
                    }
                    return new JsonRpcProvider(url.href, network);
                }
                return item;
            });
        } else if (typeof endpoints === "string") {
            const url = new URL(endpoints);
            if (!supportedProtocols.includes(url.protocol)) {
                throw new UnsupportedProtocolError(url.protocol);
            }
            return [new JsonRpcProvider(url.href, network)];
        } else {
            return [endpoints];
        }
    }
}
