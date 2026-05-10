export const plansSchema = /* GraphQL */ `
  enum PlanType {
    full
    partial
    custom
    bundle
  }

  type Plan {
    id: ID!
    name: String!
    durationMonths: Int!
    price: Float!
    currencyCode: String!
    planType: PlanType!
    description: String
    isActive: Boolean!
    serviceId: ID
    promotionId: ID
    service: Service
    promotion: Promotion
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreatePlanInput {
    name: String!
    durationMonths: Int!
    price: Float!
    currencyCode: String!
    planType: PlanType!
    description: String
    serviceId: ID
    promotionId: ID
  }

  input UpdatePlanInput {
    name: String
    durationMonths: Int
    price: Float
    currencyCode: String
    planType: PlanType
    description: String
    isActive: Boolean
  }
`;
