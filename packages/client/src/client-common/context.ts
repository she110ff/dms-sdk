import { ContextParams, ContextState } from "./interfaces/context";
import { SupportedNetwork, SupportedNetworkArray } from "./interfaces/common";
import { InvalidAddressError, UnsupportedProtocolError, UnsupportedNetworkError } from "dms-sdk-common";
import { GraphQLClient } from "graphql-request";
import { getNetwork } from "../utils/Utilty";

import { isAddress } from "@ethersproject/address";
import { Network } from "@ethersproject/networks";
import { JsonRpcProvider, Networkish } from "@ethersproject/providers";
import { AddressZero } from "@ethersproject/constants";

export { ContextParams } from "./interfaces/context";

const supportedProtocols = ["https:", "http:"];
// if (typeof process !== "undefined" && process.env?.TESTING) {
//     supportedProtocols.push("http:");
// }

// State
const defaultState: ContextState = {
    network: {
        name: "kios_mainnet",
        chainId: 215110
    },
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

    get phoneLinkAddress(): string | undefined {
        return this.state.phoneLinkAddress;
    }

    get validatorAddress(): string | undefined {
        return this.state.validatorAddress;
    }

    get currencyRateAddress(): string | undefined {
        return this.state.currencyRateAddress;
    }
    get shopAddress(): string | undefined {
        return this.state.shopAddress;
    }
    get ledgerAddress(): string | undefined {
        return this.state.ledgerAddress;
    }

    get loyaltyProviderAddress(): string | undefined {
        return this.state.loyaltyProviderAddress;
    }
    get loyaltyConsumerAddress(): string | undefined {
        return this.state.loyaltyConsumerAddress;
    }
    get loyaltyExchangerAddress(): string | undefined {
        return this.state.loyaltyExchangerAddress;
    }
    get loyaltyTransferAddress(): string | undefined {
        return this.state.loyaltyTransferAddress;
    }
    get loyaltyBridgeAddress(): string | undefined {
        return this.state.loyaltyBridgeAddress;
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

    // INTERNAL HELPERS
    private static resolveNetwork(networkish: Networkish, ensRegistryAddress?: string): Network {
        const network = getNetwork(networkish);
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        if (ensRegistryAddress) {
            if (!isAddress(ensRegistryAddress)) {
                throw new InvalidAddressError();
            } else {
                network.ensAddress = ensRegistryAddress;
            }
        }

        if (!network.ensAddress) {
            network.ensAddress = AddressZero;
        }
        return network;
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
                    return new JsonRpcProvider(url.href, this.resolveNetwork(network));
                }
                return item;
            });
        } else if (typeof endpoints === "string") {
            const url = new URL(endpoints);
            if (!supportedProtocols.includes(url.protocol)) {
                throw new UnsupportedProtocolError(url.protocol);
            }
            return [new JsonRpcProvider(url.href, this.resolveNetwork(network))];
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
        } else if (!contextParams.phoneLinkAddress) {
            throw new Error("Missing link collection contract address");
        } else if (!contextParams.validatorAddress) {
            throw new Error("Missing validator collection contract address");
        } else if (!contextParams.currencyRateAddress) {
            throw new Error("Missing token price contract address");
        } else if (!contextParams.shopAddress) {
            throw new Error("Missing shop collection  contract address");
        } else if (!contextParams.ledgerAddress) {
            throw new Error("Missing ledger contract address");
        } else if (!contextParams.loyaltyProviderAddress) {
            throw new Error("Missing loyalty provider contract address");
        } else if (!contextParams.loyaltyConsumerAddress) {
            throw new Error("Missing loyalty consumer contract address");
        } else if (!contextParams.loyaltyExchangerAddress) {
            throw new Error("Missing loyalty exchanger contract address");
        } else if (!contextParams.loyaltyTransferAddress) {
            throw new Error("Missing loyalty transfer contract address");
        } else if (!contextParams.loyaltyBridgeAddress) {
            throw new Error("Missing loyalty bridge contract address");
        } else if (!contextParams.graphqlNodes?.length) {
            throw new Error("No graphql URL defined");
        }

        this.state = {
            network: contextParams.network,
            signer: contextParams.signer,
            web3Providers: Context.resolveWeb3Providers(contextParams.web3Providers, contextParams.network),
            tokenAddress: contextParams.tokenAddress,
            phoneLinkAddress: contextParams.phoneLinkAddress,
            validatorAddress: contextParams.validatorAddress,
            currencyRateAddress: contextParams.currencyRateAddress,
            shopAddress: contextParams.shopAddress,
            ledgerAddress: contextParams.ledgerAddress,
            loyaltyProviderAddress: contextParams.loyaltyProviderAddress,
            loyaltyConsumerAddress: contextParams.loyaltyConsumerAddress,
            loyaltyExchangerAddress: contextParams.loyaltyExchangerAddress,
            loyaltyTransferAddress: contextParams.loyaltyTransferAddress,
            loyaltyBridgeAddress: contextParams.loyaltyBridgeAddress,
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
        if (contextParams.phoneLinkAddress) {
            this.state.phoneLinkAddress = contextParams.phoneLinkAddress;
        }
        if (contextParams.validatorAddress) {
            this.state.validatorAddress = contextParams.validatorAddress;
        }
        if (contextParams.currencyRateAddress) {
            this.state.currencyRateAddress = contextParams.currencyRateAddress;
        }
        if (contextParams.shopAddress) {
            this.state.shopAddress = contextParams.shopAddress;
        }
        if (contextParams.ledgerAddress) {
            this.state.ledgerAddress = contextParams.ledgerAddress;
        }
        if (contextParams.loyaltyProviderAddress) {
            this.state.loyaltyProviderAddress = contextParams.loyaltyProviderAddress;
        }
        if (contextParams.loyaltyConsumerAddress) {
            this.state.loyaltyConsumerAddress = contextParams.loyaltyConsumerAddress;
        }
        if (contextParams.loyaltyExchangerAddress) {
            this.state.loyaltyExchangerAddress = contextParams.loyaltyExchangerAddress;
        }
        if (contextParams.loyaltyTransferAddress) {
            this.state.loyaltyTransferAddress = contextParams.loyaltyTransferAddress;
        }
        if (contextParams.loyaltyBridgeAddress) {
            this.state.loyaltyBridgeAddress = contextParams.loyaltyBridgeAddress;
        }
        if (contextParams.graphqlNodes?.length) {
            this.state.graphql = Context.resolveGraphql(contextParams.graphqlNodes);
        }
    }
}
