import { gql } from "apollo-server-express";

export const typeDef = gql`
  enum GamblableEvent {
    BET_CREATE
    BET_YES_BUY
    BET_NO_BUY
    BET_YES_SELL
    BET_NO_SELL
    BET_CLAIM_PAYOUT
    BADGE_CLAIM_PAYOUT
    BADGE_BUY
    BADGE_SELL
  }

  enum SharesEventState {
    LIVE
    LOCK
    PAYOUT
  }

  type SharesEvent {
    id: ID!
    sharesSubjectQuestion: String
    sharesSubjectAddress: String
    answers: [String]
    chainId: Int
    eventState: SharesEventState
    softDelete: Boolean
    createdAt: DateTime!
    result: Boolean
  }

  type GamblableInteraction {
    id: ID!
    channel: Channel!
    type: GamblableEvent!
    user: User!
    createdAt: DateTime!
    sharesEvent: SharesEvent
    softDelete: Boolean
  }

  type GamblableEventLeaderboard {
    id: ID!
    channelId: Int!
    user: User!
    totalFees: Float!
    chainId: Int!
  }

  type NumberOfHolders {
    channel: Channel!
    holders: Int!
  }

  input GetBadgeHoldersByChannelInput {
    channelId: ID!
  }

  input PostBetInput {
    channelId: ID!
    userAddress: String!
    sharesEventId: ID!
  }

  input PostBetTradeInput {
    channelId: ID!
    chainId: Int!
    userAddress: String!
    sharesEventId: Int!
    type: GamblableEvent!
    fees: Float!
  }

  input PostBadgeTradeInput {
    channelId: ID!
    chainId: Int!
    userAddress: String!
    sharesEventId: Int!
    isBuying: Boolean!
    fees: Float!
  }

  input PostClaimPayoutInput {
    channelId: ID!
    userAddress: String!
    sharesEventId: Int!
    type: GamblableEvent!
  }

  input GetBetsByChannelInput {
    channelId: ID!
  }

  input GetBetsByUserInput {
    userAddress: String!
  }

  input GetGamblableEventLeaderboardByChannelIdInput {
    channelId: ID!
    chainId: Int!
  }

  input GetGamblableEventUserRankInput {
    channelId: ID!
    chainId: Int!
    userAddress: String!
  }

  input GetUnclaimedEvents {
    chainId: Int!
    userAddress: String
    channelId: ID
  }

  extend type Query {
    getBadgeHoldersByChannel(data: GetBadgeHoldersByChannelInput): [String]!
    getChannelsByNumberOfBadgeHolders: [NumberOfHolders]!
    getBetsByChannel(data: GetBetsByChannelInput): [GamblableInteraction]!
    getBetsByUser(data: GetBetsByUserInput): [GamblableInteraction]!
    getGamblableEventLeaderboardByChannelId(
      data: GetGamblableEventLeaderboardByChannelIdInput
    ): [GamblableEventLeaderboard!]!
    getGamblableEventUserRank(data: GetGamblableEventUserRankInput): Int!
    getUnclaimedEvents(data: GetUnclaimedEvents): [SharesEvent]!
  }

  extend type Mutation {
    postBet(data: PostBetInput!): GamblableInteraction!
    postBetTrade(data: PostBetTradeInput!): GamblableInteraction!
    postBadgeTrade(data: PostBadgeTradeInput!): GamblableInteraction!
    postClaimPayout(data: PostClaimPayoutInput!): GamblableInteraction!
  }
`;
