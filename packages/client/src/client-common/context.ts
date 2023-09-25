import { ContextParams, ContextState } from "./interfaces/context";
import { JsonRpcProvider, Networkish } from "@ethersproject/providers";
import { UnsupportedProtocolError } from "dms-sdk-common";
import { GraphQLClient } from "graphql-request";

export { ContextParams } from "./interfaces/context";

const supportedProtocols = ["https:"];
if (typeof process !== "undefined" && process.env?.TESTING) {
    supportedProtocols.push("http:");
}

// State
const defaultState: ContextState = {
    network: "mainnet",
    web3Providers: [],
    relayEndpoint: undefined
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

    // GETTERS

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

    get tokenAddress(): string | undefined {
        return this.state.tokenAddress;
    }

    get linkCollectionAddress(): string | undefined {
        return this.state.linkCollectionAddress;
    }

    get validatorCollectionAddress(): string | undefined {
        return this.state.validatorCollectionAddress;
    }

    get tokenPriceAddress(): string | undefined {
        return this.state.tokenPriceAddress;
    }
    get shopCollectionAddress(): string | undefined {
        return this.state.shopCollectionAddress;
    }
    get ledgerAddress(): string | undefined {
        return this.state.ledgerAddress;
    }

    /**
     * Getter for the GraphQL client
     *
     * @var graphql
     *
     * @returns {GraphQLClient[] | undefined}
     *
     * @public
     */
    get graphql(): GraphQLClient[] | undefined {
        return this.state.graphql || defaultState.graphql;
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

    private static resolveGraphql(endpoints: { url: string }[]): GraphQLClient[] {
        let clients: GraphQLClient[] = [];
        endpoints.forEach((endpoint) => {
            const url = new URL(endpoint.url);
            if (!supportedProtocols.includes(url.protocol)) {
                throw new UnsupportedProtocolError(url.protocol);
            }
            clients.push(new GraphQLClient(url.href));
        });
        return clients;
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
        } else if (!contextParams.tokenAddress) {
            throw new Error("Missing token contract address");
        } else if (!contextParams.linkCollectionAddress) {
            throw new Error("Missing link collection contract address");
        } else if (!contextParams.validatorCollectionAddress) {
            throw new Error("Missing validator collection contract address");
        } else if (!contextParams.tokenPriceAddress) {
            throw new Error("Missing token price contract address");
        } else if (!contextParams.shopCollectionAddress) {
            throw new Error("Missing shop collection  contract address");
        } else if (!contextParams.ledgerAddress) {
            throw new Error("Missing ledger contract address");
        } else if (!contextParams.graphqlNodes?.length) {
            throw new Error("No graphql URL defined");
        }

        this.state = {
            network: contextParams.network,
            signer: contextParams.signer,
            web3Providers: Context.resolveWeb3Providers(contextParams.web3Providers, contextParams.network),
            tokenAddress: contextParams.tokenAddress,
            linkCollectionAddress: contextParams.linkCollectionAddress,
            validatorCollectionAddress: contextParams.validatorCollectionAddress,
            tokenPriceAddress: contextParams.tokenPriceAddress,
            shopCollectionAddress: contextParams.shopCollectionAddress,
            ledgerAddress: contextParams.ledgerAddress,
            graphql: Context.resolveGraphql(contextParams.graphqlNodes)
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
        if (contextParams.tokenAddress) {
            this.state.tokenAddress = contextParams.tokenAddress;
        }
        if (contextParams.linkCollectionAddress) {
            this.state.linkCollectionAddress = contextParams.linkCollectionAddress;
        }
        if (contextParams.validatorCollectionAddress) {
            this.state.validatorCollectionAddress = contextParams.validatorCollectionAddress;
        }
        if (contextParams.tokenPriceAddress) {
            this.state.tokenPriceAddress = contextParams.tokenPriceAddress;
        }
        if (contextParams.shopCollectionAddress) {
            this.state.shopCollectionAddress = contextParams.shopCollectionAddress;
        }
        if (contextParams.ledgerAddress) {
            this.state.ledgerAddress = contextParams.ledgerAddress;
        }
        if (contextParams.graphqlNodes?.length) {
            this.state.graphql = Context.resolveGraphql(contextParams.graphqlNodes);
        }
    }
}
