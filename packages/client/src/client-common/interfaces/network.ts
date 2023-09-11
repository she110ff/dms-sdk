import fetch, { UnfetchResponse } from "unfetch";
import { GenericRecord } from "./common";
import { InvalidResponseError } from "../../utils/errors";

export namespace Network {
    /**
     * Performs a request and returns a JSON object with the response
     */

    export async function get(endpoint: URL, data?: GenericRecord) {
        for (const [key, value] of Object.entries(data ?? {})) {
            if (value != null) {
                endpoint.searchParams.set(key, String(value));
            }
        }
        const response: UnfetchResponse = await fetch(endpoint.href, {
            method: "GET"
        });
        if (!response.ok) {
            throw new InvalidResponseError(response);
        }
        return response.json();
    }

    export async function post(endpoint: URL, data?: any) {
        const response: UnfetchResponse = await fetch(endpoint.href, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new InvalidResponseError(response);
        }
        return response.json();
    }
}
