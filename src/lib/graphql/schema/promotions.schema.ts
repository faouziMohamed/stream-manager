export const promotionsSchema = /* GraphQL */ `
    type Promotion {
        id: ID!
        name: String!
        description: String
        isActive: Boolean!
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
    }

    input UpdatePromotionInput {
        name: String
        description: String
        isActive: Boolean
        serviceIds: [ID!]
        startsAt: DateTime
        expiresAt: DateTime
    }
`;
