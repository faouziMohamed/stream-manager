// Streaming profiles schema
export const streamingProfilesSchema = /* GraphQL */ `
  type StreamingProfile {
    id: ID!
    accountId: ID!
    name: String!
    profileIndex: Int!
    pin: String
    isActive: Boolean!
    assignment: SubscriptionProfileAssignment
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateProfileInput {
    accountId: ID!
    name: String!
    profileIndex: Int
    pin: String
  }

  input UpdateProfileInput {
    name: String
    profileIndex: Int
    pin: String
    isActive: Boolean
  }
`;
