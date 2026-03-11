export const servicesSchema = /* GraphQL */ `
  type Service {
    id: ID!
    name: String!
    category: String!
    description: String
    logoUrl: String
    isActive: Boolean!
    plans: [Plan!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateServiceInput {
    name: String!
    category: String!
    description: String
    logoUrl: String
  }

  input UpdateServiceInput {
    name: String
    category: String
    description: String
    logoUrl: String
    isActive: Boolean
  }
`;
