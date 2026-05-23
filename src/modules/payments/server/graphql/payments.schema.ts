export const paymentsSchema = /* GraphQL */ `
  enum PaymentStatus {
    paid
    unpaid
    overdue
  }

  type Payment {
    id: ID!
    subscriptionId: ID!
    dueDate: Date!
    paidDate: Date
    amount: Float!
    currencyCode: String!
    status: PaymentStatus!
    notes: JSON
    subscription: Subscription!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input UpdatePaymentInput {
    status: PaymentStatus
    paidDate: Date
    notes: JSON
  }
`;
