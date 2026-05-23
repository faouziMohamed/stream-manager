export const promotionsSchema = /* GraphQL */ `
  type Promotion {
    id: ID!
    name: String!
    description: JSON
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
    description: JSON
    serviceIds: [ID!]!
    newServiceName: String
    newServiceCategory: String
    startsAt: DateTime
    expiresAt: DateTime
    showOnHomepage: Boolean
  }

  input UpdatePromotionInput {
    name: String
    description: JSON
    isActive: Boolean
    showOnHomepage: Boolean
    serviceIds: [ID!]
    startsAt: DateTime
    expiresAt: DateTime
  }
`;
