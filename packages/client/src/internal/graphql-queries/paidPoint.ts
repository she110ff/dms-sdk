import { gql } from "graphql-request";

export const QueryPaidPoint = gql`
    query PaidPoint($where: PaidPoint_filter!) {
        paidPoints(where: $where) {
            id
            account
            paidPoint
            paidValue
            feePoint
            feeValue
            balancePoint
            purchaseId
            shopId
            blockNumber
            blockTimestamp
            transactionHash
        }
    }
`;
