import { gql } from "apollo-server-express";

export const typeDef = gql`
  type NFC implements Likable {
    id: ID!
    title: String
    videoLink: String
    score: Int!
    liked: Boolean
    disliked: Boolean
    owner: User!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input NFCFeedInput {
    limit: Int
    orderBy: SortBy
  }

  input HandleNFCInput {
    title: String!
  }

  extend type Query {
    getNFCFeed(data: NFCFeedInput): [NFC]
  }

  extend type Mutation {
    handleNFC(data: HandleNFCInput!): Int
  }
`;