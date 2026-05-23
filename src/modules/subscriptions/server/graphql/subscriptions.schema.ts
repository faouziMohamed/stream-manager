export const subscriptionsSchema = /* GraphQL */ `
  enum SubscriptionStatus {
    active
    expired
    paused
    cancelled
  }

  type Subscription {
    id: ID!
    clientId: ID!
    planId: ID!
    startDate: Date!
    endDate: Date!
    isRecurring: Boolean!
    status: SubscriptionStatus!
    notes: JSON
    renewedFromId: ID
    client: Client!
    plan: Plan!
    payments: [Payment!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateSubscriptionInput {
    clientId: ID!
    planId: ID!
    startDate: Date!
    isRecurring: Boolean!
    notes: JSON
  }

  input UpdateSubscriptionInput {
    startDate: Date
    isRecurring: Boolean
    status: SubscriptionStatus
    notes: JSON
  }

  input RenewSubscriptionInput {
    subscriptionId: ID!
    startDate: Date!
    isRecurring: Boolean!
    notes: JSON
  }
`;
