export const clientsSchema = /* GraphQL */ `
  type Client {
    id: ID!
    name: String!
    email: String
    phone: String
    notes: JSON
    isActive: Boolean!
    subscriptions: [Subscription!]!
    activeSubscriptionsCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateClientInput {
    name: String!
    email: String
    phone: String
    notes: JSON
  }

  input UpdateClientInput {
    name: String
    email: String
    phone: String
    notes: JSON
    isActive: Boolean
  }
`;
