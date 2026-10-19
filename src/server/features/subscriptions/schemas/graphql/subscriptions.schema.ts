// The domain entity stays "Membership" in the schema: GraphQL reserves the
// name `Subscription` for the subscription root type. The console calls these
// "subscriptions" in its copy.
export const subscriptionsTypeDefs = /* GraphQL */ `
  type AvailableProfileDto {
    accountId: ID!
    accountLabel: String!
    profileId: ID!
    profileName: String!
  }

  type CreatedSubscriptionDto {
    assignedProfileId: ID
    customerId: ID!
    endDate: String!
    id: ID!
    paymentId: ID!
    paymentStatus: String!
    reference: String!
    startDate: String!
  }

  input NewSubscriptionCustomerInput {
    email: String
    name: String!
    phone: String
  }

  input SubscriptionProfileInput {
    accountId: ID!
    profileId: ID!
  }

  input CreateSubscriptionInput {
    customerId: ID
    isRecurring: Boolean
    markPaid: Boolean
    newCustomer: NewSubscriptionCustomerInput
    planId: ID!
    profile: SubscriptionProfileInput
    startDate: String!
  }

  extend type Query {
    availableProfiles(serviceId: ID!): [AvailableProfileDto!]!
  }

  extend type Mutation {
    createSubscription(input: CreateSubscriptionInput!): CreatedSubscriptionDto!
  }
`;
