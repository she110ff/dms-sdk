import { gql } from "graphql-request";

export const QueryUserTradeHistory = gql`
    query UserTradeHistories(
        $where: UserTradeHistory_filter!
        $limit: Int!
        $skip: Int!
        $direction: OrderDirection!
        $sortBy: UserTradeHistory_orderBy!
    ) {
        userTradeHistories(where: $where, first: $limit, orderBy: $sortBy, orderDirection: $direction, skip: $skip) {
            id
            email
            action
            assetFlow
            amountPoint
            amountToken
            value
            balancePoint
            balanceToken
            purchaseId
            shopId
            account
            blockNumber
            blockTimestamp
            transactionHash
        }
    }
`;
