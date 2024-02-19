import { gql } from "graphql-request";

export const QueryShopTradeHistory = gql`
    query ShopTradeHistories(
        $where: ShopTradeHistory_filter!
        $limit: Int!
        $skip: Int!
        $direction: OrderDirection!
        $sortBy: ShopTradeHistory_orderBy!
    ) {
        shopTradeHistories(where: $where, first: $limit, orderBy: $sortBy, orderDirection: $direction, skip: $skip) {
            id
            shopId
            currency
            pageType
            action
            cancel
            increase
            providedAmount
            usedAmount
            settledAmount
            withdrawnAmount
            purchaseId
            paymentId
            blockNumber
            blockTimestamp
            transactionHash
        }
    }
`;
