export const accountsSchema = /* GraphQL */ `
    type StreamingAccount {
        id: ID!
        serviceId: ID!
        service: Service
        label: String!
        email: String
        phone: String
        supportsProfiles: Boolean!
        maxProfiles: Int!
        notes: String
        isActive: Boolean!
        usedProfiles: Int!
        profiles: [StreamingProfile!]!
        accountAssignment: SubscriptionProfileAssignment
        createdAt: DateTime!
        updatedAt: DateTime!
    }

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

    type SubscriptionProfileAssignment {
        id: ID!
        subscriptionId: ID!
        accountId: ID!
        profileId: ID
        subscription: Subscription
        createdAt: DateTime!
    }

    input CreateAccountInput {
        serviceId: ID!
        label: String!
        email: String
        phone: String
        supportsProfiles: Boolean
        maxProfiles: Int
        notes: String
    }

    input UpdateAccountInput {
        label: String
        email: String
        phone: String
        supportsProfiles: Boolean
        maxProfiles: Int
        notes: String
        isActive: Boolean
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

    input AssignProfileInput {
        subscriptionId: ID!
        accountId: ID!
        profileId: ID
    }
`;
