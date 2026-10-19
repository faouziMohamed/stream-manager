export const settingsTypeDefs = /* GraphQL */ `
  scalar Upload

  enum MediaCategory {
    LIBRARY
    SERVICES
    AVATARS
  }

  type SummaryLink {
    id: ID!
    token: String!
    label: String
    expiresAt: String
    createdAt: String!
  }

  type MediaAsset {
    id: ID!
    storageKey: String!
    originalFilename: String!
    contentType: String!
    sizeBytes: Int!
    uploadedByUserId: ID!
    createdAt: String!
    imageUrl: String!
  }

  type MediaAssetConnection {
    items: [MediaAsset!]!
    pageInfo: PageInfo!
  }

  type DeleteMediaAssetPayload {
    id: ID!
  }

  type NotificationEventSetting {
    event: String!
    enabled: Boolean!
  }

  input ListMediaAssetsInput {
    page: Int = 1
    pageSize: Int = 20
  }

  input DeleteMediaAssetInput {
    id: ID!
  }

  input ToggleNotificationEventInput {
    event: String!
    enabled: Boolean!
  }

  input GenerateSummaryLinkInput {
    label: String
    expiresInDays: Int
  }

  input RevokeSummaryLinkInput {
    id: ID!
  }

  extend type Mutation {
    uploadMedia(file: Upload!, category: MediaCategory): MediaAsset!
    deleteMediaAsset(input: DeleteMediaAssetInput!): DeleteMediaAssetPayload!
    toggleNotificationEvent(input: ToggleNotificationEventInput!): Boolean!
    generateSummaryLink(input: GenerateSummaryLinkInput): SummaryLink!
    revokeSummaryLink(input: RevokeSummaryLinkInput!): Boolean!
  }

  type AccountantMembershipItem {
    id: ID!
    businessId: String!
    customerName: String!
    planName: String!
    status: String!
    startDate: String!
    endDate: String!
    isRecurring: Boolean!
  }

  type AccountantPaymentItem {
    id: ID!
    businessId: String!
    customerName: String!
    amount: String!
    currencyCode: String!
    status: String!
    dueDate: String!
    paidDate: String
    method: String
  }

  type AccountantSummary {
    memberships: [AccountantMembershipItem!]!
    payments: [AccountantPaymentItem!]!
  }

  extend type Query {
    notificationSettings: [NotificationEventSetting!]!
    mediaAssets(input: ListMediaAssetsInput): MediaAssetConnection!
    summaryLinks: [SummaryLink!]!
    summaryByToken(token: String!): AccountantSummary
  }
`;
