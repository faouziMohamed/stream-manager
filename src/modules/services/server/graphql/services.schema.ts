export const servicesSchema = /* GraphQL */ `
  type Service {
    id: ID!
    name: String!
    category: String!
    description: String
    logoUrl: String
    isActive: Boolean!
    showOnHomepage: Boolean!
    plans: [Plan!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    deletedAt: DateTime
  }

  input CreateServiceInput {
    name: String!
    category: String!
    description: String
    logoUrl: String
    showOnHomepage: Boolean
  }

  input UpdateServiceInput {
    name: String
    category: String
    description: String
    logoUrl: String
    isActive: Boolean
    showOnHomepage: Boolean
  }
`;
