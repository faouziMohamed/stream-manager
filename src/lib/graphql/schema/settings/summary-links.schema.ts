// Summary links schema
export const summaryLinksSchema = /* GraphQL */ `
  type SummaryLink {
    id: ID!
    token: String!
    label: String
    showSensitiveInfo: Boolean!
    isActive: Boolean!
    expiresAt: DateTime
    shareUrl: String!
    createdAt: DateTime!
  }
`;
