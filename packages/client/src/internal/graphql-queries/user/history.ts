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
            account
            pageType
            action
            cancel
            loyaltyType
            amountPoint
            amountToken
            amountValue
            balancePoint
            balanceToken
            purchaseId
            paymentId
            shopId
            blockNumber
            blockTimestamp
            transactionHash
        }
    }
`;
