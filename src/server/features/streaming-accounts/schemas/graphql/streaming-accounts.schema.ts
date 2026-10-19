export const streamingAccountsTypeDefs = /* GraphQL */ `
  type StreamingAccount {
    id: ID!
    serviceId: ID!
    label: String!
    email: String
    supportsProfiles: Boolean!
    maxProfiles: Int!
    isActive: Boolean!
    profiles: [StreamingProfile!]
    createdAt: String!
    updatedAt: String!
  }

  type StreamingProfile {
    assignmentId: ID
    """
    When this profile was handed to its membership; null while unassigned.
    """
    assignedAt: String
    id: ID!
    accountId: ID!
    membershipId: ID
    name: String!
    isAssigned: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type StreamingProfileAssignment {
    id: ID!
    membershipId: ID!
    accountId: ID!
    profileId: ID
    assignedAt: String!
    createdAt: String!
  }

  input CreateStreamingAccountInput {
    serviceId: ID!
    label: String!
    email: String
    password: String
    supportsProfiles: Boolean
    maxProfiles: Int
  }

  input CreateStreamingProfileInput {
    accountId: ID!
    name: String!
    pin: String
  }

  input AssignProfileToMembershipInput {
    membershipId: ID!
    profileId: ID!
    accountId: ID!
  }

  input UnassignProfileInput {
    assignmentId: ID!
  }

  input UpdateStreamingAccountInput {
    id: ID!
    label: String
    email: String
    password: String
    supportsProfiles: Boolean
    maxProfiles: Int
  }

  input UpdateStreamingProfileInput {
    id: ID!
    name: String
    pin: String
  }

  input DeleteStreamingAccountInput {
    id: ID!
  }

  input DeleteStreamingProfileInput {
    id: ID!
  }

  extend type Query {
    streamingAccounts: [StreamingAccount!]!
    streamingAccount(id: ID!): StreamingAccount
    streamingProfiles(accountId: ID!): [StreamingProfile!]!
  }

  extend type Mutation {
    createStreamingAccount(input: CreateStreamingAccountInput!): StreamingAccount!
    updateStreamingAccount(input: UpdateStreamingAccountInput!): StreamingAccount!
    deleteStreamingAccount(input: DeleteStreamingAccountInput!): StreamingAccount!
    createStreamingProfile(input: CreateStreamingProfileInput!): StreamingProfile!
    updateStreamingProfile(input: UpdateStreamingProfileInput!): StreamingProfile!
    deleteStreamingProfile(input: DeleteStreamingProfileInput!): StreamingProfile!
    assignProfileToMembership(input: AssignProfileToMembershipInput!): StreamingProfileAssignment!
    unassignProfile(input: UnassignProfileInput!): StreamingProfile!
  }
`;
