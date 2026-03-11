// Profile assignments schema
export const profileAssignmentsSchema = /* GraphQL */ `
  type SubscriptionProfileAssignment {
    id: ID!
    subscriptionId: ID!
    accountId: ID!
    profileId: ID
    subscription: Subscription
    createdAt: DateTime!
  }

  input AssignProfileInput {
    subscriptionId: ID!
    accountId: ID!
    profileId: ID
  }
`;
