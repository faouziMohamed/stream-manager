export const paymentsTypeDefs = /* GraphQL */ `
  type Payment {
    id: ID!
    businessId: String!
    membershipId: ID!
    customerId: ID!
    dueDate: String!
    paidDate: String
    amount: String!
    currencyCode: String!
    status: String!
    method: String
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  input MarkPaymentPaidInput {
    id: ID!
    paidDate: String
  }

  input CreatePaymentInput {
    membershipId: ID!
    amount: String!
    currencyCode: String
    dueDate: String!
    paidDate: String
    method: String
    notes: String
    status: String
  }

  type PaymentConnection {
    items: [Payment!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    payment(id: ID!): Payment
    payments(
      page: Int = 1
      pageSize: Int = 20
      customerId: ID
      membershipId: ID
      status: String
      dueFrom: String
      dueTo: String
      """
      Due-date order. The agenda works oldest first; the ledger newest first.
      """
      order: String
    ): PaymentConnection!
  }

  extend type Mutation {
    createPayment(input: CreatePaymentInput!): Payment!
    markPaymentPaid(input: MarkPaymentPaidInput!): Payment!
  }
`;
