export const servicesTypeDefs = /* GraphQL */ `
  type PageInfo {
    page: Int!
    pageSize: Int!
    total: Int!
    totalPages: Int!
  }

  type Service {
    id: ID!
    name: String!
    category: String!
    descriptionContent: JSON
    imageKey: String
    imageUrl: String
    isActive: Boolean!
    supportsProfiles: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  scalar JSON

  type ServiceConnection {
    items: [Service!]!
    pageInfo: PageInfo!
  }

  input CreateServiceInput {
    name: String!
    category: String!
    descriptionContent: JSON
    imageKey: String
    supportsProfiles: Boolean
  }

  input UpdateServiceInput {
    id: ID!
    name: String
    category: String
    descriptionContent: JSON
    imageKey: String
    isActive: Boolean
    supportsProfiles: Boolean
  }

  extend type Query {
    service(id: ID!): Service
    services(page: Int = 1, pageSize: Int = 20): ServiceConnection!
    publicServices: [Service!]!
  }

  extend type Mutation {
    archiveService(id: ID!): Service!
    createService(input: CreateServiceInput!): Service!
    restoreService(id: ID!): Service!
    updateService(input: UpdateServiceInput!): Service!
  }
`;
