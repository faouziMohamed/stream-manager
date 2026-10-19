export const plansTypeDefs = /* GraphQL */ `
  type Plan {
    id: ID!
    name: String!
    durationMonths: Int!
    price: String!
    currencyCode: String!
    planType: String!
    descriptionContent: JSON
    serviceId: ID!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  input CreatePlanInput {
    name: String!
    durationMonths: Int!
    price: String!
    currencyCode: String = "MAD"
    planType: String = "individual"
    descriptionContent: JSON
    serviceId: ID!
  }

  input UpdatePlanInput {
    id: ID!
    name: String
    durationMonths: Int
    price: String
    currencyCode: String
    planType: String
    descriptionContent: JSON
    serviceId: ID
    isActive: Boolean
  }

  input DeletePlanInput {
    id: ID!
  }

  type PlanConnection {
    items: [Plan!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    plan(id: ID!): Plan
    plans(
      page: Int = 1
      pageSize: Int = 20
      serviceId: ID
      planType: String
      isActive: Boolean
    ): PlanConnection!
  }

  extend type Mutation {
    deletePlan(input: DeletePlanInput!): Plan!
    createPlan(input: CreatePlanInput!): Plan!
    updatePlan(input: UpdatePlanInput!): Plan!
  }
`;
