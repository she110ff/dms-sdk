import fetch, { UnfetchResponse } from "unfetch";
import { GenericRecord } from "./common";
import { NetworkError, BadRequestError, NotFoundError } from "../../utils/errors";

export class Network {
    /**
     * Performs a request and returns a JSON object with the response
     */
    public static async get(endpoint: URL, data?: GenericRecord, additionalHeaders?: any): Promise<any> {
        for (const [key, value] of Object.entries(data ?? {})) {
            if (value != null) {
                endpoint.searchParams.set(key, String(value));
            }
        }
        const headers = {
            "Content-Type": "application/json",
            ...additionalHeaders
        };
        const response: UnfetchResponse = await fetch(endpoint.href, {
            method: "GET",
            headers
        });

        if (!response.ok) {
            switch (response.status) {
                case 400:
                    throw new BadRequestError(response.status, response.statusText);
                case 404:
                    throw new NotFoundError(response.status, response.statusText);
                default:
                    throw new NetworkError(response.status, response.statusText);
            }
        }

        return response.json();
    }

    public static async post(endpoint: URL, data?: any, additionalHeaders?: any): Promise<any> {
        const headers = {
            "Content-Type": "application/json",
            ...additionalHeaders
        };
        const response: UnfetchResponse = await fetch(endpoint.href, {
            method: "POST",
            headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            switch (response.status) {
                case 400:
                    throw new BadRequestError(response.status, response.statusText);
                case 404:
                    throw new NotFoundError(response.status, response.statusText);
                default:
                    throw new NetworkError(response.status, response.statusText);
            }
        }

        return response.json();
    }
}
