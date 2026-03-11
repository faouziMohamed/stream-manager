export const promotionsSchema = /* GraphQL */ `
  type Promotion {
    id: ID!
    name: String!
    description: String
    isActive: Boolean!
    showOnHomepage: Boolean!
    startsAt: DateTime
    expiresAt: DateTime
    isExpired: Boolean!
    services: [Service!]!
    plans: [Plan!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreatePromotionInput {
    name: String!
    description: String
    serviceIds: [ID!]!
    newServiceName: String
    newServiceCategory: String
    startsAt: DateTime
    expiresAt: DateTime
    showOnHomepage: Boolean
  }

  input UpdatePromotionInput {
    name: String
    description: String
    isActive: Boolean
    showOnHomepage: Boolean
    serviceIds: [ID!]
    startsAt: DateTime
    expiresAt: DateTime
  }
`;
