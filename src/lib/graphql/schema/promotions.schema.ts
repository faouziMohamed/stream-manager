export const promotionsSchema = /* GraphQL */ `
  type Promotion {
    id: ID!
    name: String!
    description: String
    isActive: Boolean!
    services: [Service!]!
    plans: [Plan!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreatePromotionInput {
    name: String!
    description: String
    serviceIds: [ID!]!
  }

  input UpdatePromotionInput {
    name: String
    description: String
    isActive: Boolean
    serviceIds: [ID!]
  }
`;
