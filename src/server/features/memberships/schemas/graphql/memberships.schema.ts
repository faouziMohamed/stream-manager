export const membershipsTypeDefs = /* GraphQL */ `
  type Membership {
    id: ID!
    businessId: String!
    customerId: ID!
    planId: ID!
    startDate: String!
    endDate: String!
    isRecurring: Boolean!
    status: String!
    renewedFromId: ID
    createdAt: String!
    updatedAt: String!
  }

  type MembershipConnection {
    items: [Membership!]!
    pageInfo: PageInfo!
  }

  input CreateMembershipInput {
    customerId: ID!
    planId: ID!
    startDate: String!
    isRecurring: Boolean = false
  }

  input RenewMembershipInput {
    id: ID!
    markPaid: Boolean
    """
    Actual day the money was taken, when it differs from the day it is recorded.
    """
    paidDate: String
    terms: Int
  }

  input CancelMembershipInput {
    id: ID!
    confirmed: Boolean!
  }

  extend type Query {
    membership(id: ID!): Membership
    memberships(
      page: Int = 1
      pageSize: Int = 20
      status: String
      customerId: ID
      planId: ID
      serviceId: ID
    ): MembershipConnection!
  }

  extend type Mutation {
    cancelMembership(input: CancelMembershipInput!): Membership!
    createMembership(input: CreateMembershipInput!): Membership!
    renewMembership(input: RenewMembershipInput!): Membership!
  }
`;
