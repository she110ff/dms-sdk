import { gql } from "graphql-request";

export const QueryPaidToken = gql`
    query PaidToken($where: PaidToken_filter!) {
        paidTokens(where: $where) {
            id
            email
            paidAmountToken
            value
            balanceToken
            purchaseId
            shopId
            blockNumber
            blockTimestamp
            transactionHash
        }
    }
`;
