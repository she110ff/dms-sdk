import { gql } from "graphql-request";

export const QueryPaidToken = gql`
    query PaidToken($where: PaidToken_filter!) {
        paidTokens(where: $where) {
            id
            account
            paidToken
            paidValue
            feeToken
            feeValue
            balanceToken
            purchaseId
            shopId
            blockNumber
            blockTimestamp
            transactionHash
        }
    }
`;
