import { Client, Context } from "../../src";

import { NodeInfo } from "../helper/NodeInfo";

describe("Integrated test of Ledger", () => {
    const contextParams = NodeInfo.getContextParams();
    describe("Method Check", () => {
        let client: Client;
        beforeAll(async () => {
            const ctx = new Context(contextParams);
            client = new Client(ctx);
        });

        describe("GraphQL TEST", () => {
            it("Get Save & Use History", async () => {
                const res = await client.ledger.getTotalEstimatedSaveHistory(
                    "0xfD71edD159aEdB1a5e633e1553A70F7AaA636480"
                );
                console.log(res);
            });
            it("Get Save & Use History2", async () => {
                const res = await client.shop.getTotalEstimatedProvideHistory(
                    "0xbe96d74202df38fd21462ffcef10dfe0fcbd7caa3947689a3903e8b6b8749fda"
                );
                console.log(res);
            });
        });
    });
});
