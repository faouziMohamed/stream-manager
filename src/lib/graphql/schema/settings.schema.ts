export const settingsSchema = /* GraphQL */ `
  type AppSetting {
    key: String!
    value: String!
  }

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

  input CreateInquiryInput {
    name: String!
    email: String
    phone: String
    message: String!
  }
`;
