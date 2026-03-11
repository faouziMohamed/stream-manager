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
    notes: String
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
    notes: String
  }

  input UpdateSubscriptionInput {
    startDate: Date
    isRecurring: Boolean
    status: SubscriptionStatus
    notes: String
  }

  input RenewSubscriptionInput {
    subscriptionId: ID!
    startDate: Date!
    isRecurring: Boolean!
    notes: String
  }
`;
