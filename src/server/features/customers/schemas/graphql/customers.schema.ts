export const customersTypeDefs = /* GraphQL */ `
  type Customer {
    id: ID!
    businessId: String!
    name: String!
    email: String
    phone: String
    notesContent: JSON
    """
    Language its documents are written in: "fr" or "en".
    """
    language: String!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type CustomerConnection {
    items: [Customer!]!
    pageInfo: PageInfo!
  }

  input CreateCustomerInput {
    language: String
    name: String!
    email: String
    phone: String
    notesContent: JSON
  }

  input UpdateCustomerInput {
    id: ID!
    name: String
    email: String
    phone: String
    notesContent: JSON
    language: String
    isActive: Boolean
  }

  extend type Mutation {
    archiveCustomer(id: ID!): Customer!
    createCustomer(input: CreateCustomerInput!): Customer!
    updateCustomer(input: UpdateCustomerInput!): Customer!
  }

  extend type Query {
    customer(id: ID!): Customer
    customers(page: Int = 1, pageSize: Int = 20): CustomerConnection!
  }
`;
