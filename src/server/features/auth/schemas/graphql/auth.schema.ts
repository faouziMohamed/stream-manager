export const authTypeDefs = /* GraphQL */ `
  type SessionDto {
    id: ID!
    browser: String
    os: String
    deviceType: String
    countryCode: String
    createdAt: String!
    lastUsedAt: String!
    current: Boolean!
  }

  type UserManagementDto {
    id: ID!
    name: String!
    email: String!
    role: String!
    avatar: String
    createdAt: String!
    updatedAt: String!
  }

  type DeletedUserDto {
    id: ID!
    name: String!
    email: String!
  }

  input RevokeSessionInput {
    id: ID!
  }

  input UpdateUserRoleInput {
    id: ID!
    role: String!
  }

  input DeleteUserInput {
    id: ID!
  }

  input LogoutUserDevicesInput {
    userId: ID!
  }

  extend type Query {
    sessions: [SessionDto!]!
    users: [UserManagementDto!]!
  }

  extend type Mutation {
    logout: Boolean!
    logoutAllDevices: Boolean!
    revokeSession(input: RevokeSessionInput!): Boolean!
    updateUserRole(input: UpdateUserRoleInput!): UserManagementDto!
    deleteUser(input: DeleteUserInput!): DeletedUserDto!
    logoutUserDevices(input: LogoutUserDevicesInput!): Boolean!
  }
`;
