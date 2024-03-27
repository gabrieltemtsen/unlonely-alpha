import { gql } from "apollo-server-express";

export const typeDef = gql`

    type TempToken {
        id: ID!
        tokenAddress: String!
        chainId: Int!
        channelId: Int!
        ownerAddress: String!
        name: String!
        symbol: String!
        endUnixTimestamp: BigInt!
        protocolFeePercentage: BigInt!
        streamerFeePercentage: BigInt!
        highestTotalSupply: BigInt!
        hasRemainingFundsForCreator: Boolean!
        isAlwaysTradeable: Boolean!
        hasHitTotalSupplyThreshold: Boolean!
    }

    input GetTempTokensInput {
        tokenAddress: String
        ownerAddress: String
        chainId: Int
        channelId: Int
        onlyActiveTokens: Boolean
        hasHitTotalSupplyThreshold: Boolean
        isAlwaysTradeable: Boolean
    }

    input UpdateTempTokenHasRemainingFundsForCreatorInput {
        chainId: Int!
        channelId: Int!
    }

    input UpdateTempTokenHighestTotalSupplyInput {
        tokenAddresses: [String!]!
        chainId: Int!
        newTotalSupplies: [String!]!
    }

    input PostTempTokenInput {
        tokenAddress: String!
        chainId: Int!
        channelId: Int!
        ownerAddress: String!
        name: String!
        symbol: String!
        endUnixTimestamp: String!
        protocolFeePercentage: String!
        streamerFeePercentage: String!
    }

    input UpdateEndTimestampForTokensInput {
        tokenAddresses: [String]!
        additionalDurationInSeconds: Int!
        chainId: Int!
    }

    input UpdateTempTokenIsAlwaysTradeableInput {
        tokenAddressesSetTrue: [String!]!
        tokenAddressesSetFalse: [String!]!
        chainId: Int!
    }

    input UpdateTempTokenHasHitTotalSupplyThresholdInput {
        tokenAddressesSetTrue: [String!]!
        tokenAddressesSetFalse: [String!]!
        chainId: Int!
    }

    extend type Query {
        getTempTokens(data: GetTempTokensInput): [TempToken]
    }

    extend type Mutation {
        updateTempTokenHighestTotalSupply(data: UpdateTempTokenHighestTotalSupplyInput!): Int!
        updateEndTimestampForTokens(data: UpdateEndTimestampForTokensInput!): [TempToken]
        updateTempTokenHasRemainingFundsForCreator(data: UpdateTempTokenHasRemainingFundsForCreatorInput!): [TempToken]
        updateTempTokenIsAlwaysTradeable(data: UpdateTempTokenIsAlwaysTradeableInput!): Boolean!
        updateTempTokenHasHitTotalSupplyThreshold(data: UpdateTempTokenHasHitTotalSupplyThresholdInput!): Boolean!
        postTempToken(data: PostTempTokenInput!): TempToken
    }
`;