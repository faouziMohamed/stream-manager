export const streamingAccountsSchema = /* GraphQL */ `
  type StreamingAccount {
    id: ID!
    serviceId: ID!
    service: Service
    label: String!
    email: String
    phone: String
    supportsProfiles: Boolean!
    maxProfiles: Int!
    notes: JSON
    isActive: Boolean!
    usedProfiles: Int!
    profiles: [StreamingProfile!]!
    accountAssignment: SubscriptionProfileAssignment
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateAccountInput {
    serviceId: ID!
    label: String!
    email: String
    phone: String
    supportsProfiles: Boolean
    maxProfiles: Int
    notes: JSON
  }

  input UpdateAccountInput {
    label: String
    email: String
    phone: String
    supportsProfiles: Boolean
    maxProfiles: Int
    notes: JSON
    isActive: Boolean
  }
`;
