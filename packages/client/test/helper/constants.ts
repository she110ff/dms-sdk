import { Wallet } from "@ethersproject/wallet";
import { ContextParams } from "../../src";

export const web3EndpointsMainnet = {
    working: ["https://mainnet.bosagora.org/"],
    failing: ["https://bad-url-gateway.io/"]
};

export const web3EndpointsDevnet = {
    working: ["http://rpc.devnet.bosagora.org:8545/"],
    failing: ["https://bad-url-gateway.io/"]
};

export const TEST_WALLET_ADDRESS = "0xc8195b3420abb2AcDdc3C309d4Ed22ddAAa0d8CE";
export const TEST_WALLET = "d09672244a06a32f74d051e5adbbb62ae0eda27832a973159d475da6d53ba5c0";

const grapqhlEndpoints = {
    working: [
        {
            url: "http://subgraph.devnet.bosagora.org:8000/subgraphs/name/bosagora/dms-osx-devnet"
        }
    ],
    timeout: [
        {
            url: "https://httpstat.us/504?sleep=100"
        },
        {
            url: "https://httpstat.us/504?sleep=200"
        },
        {
            url: "https://httpstat.us/504?sleep=300"
        }
    ],
    failing: [{ url: "https://bad-url-gateway.io/" }]
};

export const contextParamsMainnet: ContextParams = {
    network: 2151,
    signer: new Wallet(TEST_WALLET),
    web3Providers: web3EndpointsMainnet.working,
    graphqlNodes: grapqhlEndpoints.working
};

export const contextParamsDevnet: ContextParams = {
    network: 24680,
    signer: new Wallet(TEST_WALLET),
    web3Providers: web3EndpointsDevnet.working,
    graphqlNodes: grapqhlEndpoints.working
};

export const contextParamsLocalChain: ContextParams = {
    network: "bosagora_devnet",
    signer: new Wallet(TEST_WALLET),
    web3Providers: ["http://localhost:7545"],
    relayEndpoint: "http://localhost:7070",
    graphqlNodes: grapqhlEndpoints.working
};

export const contextParamsFailing: ContextParams = {
    network: "mainnet",
    signer: new Wallet(TEST_WALLET),
    web3Providers: web3EndpointsMainnet.failing,
    graphqlNodes: grapqhlEndpoints.working
};
