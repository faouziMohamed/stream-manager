// Notification settings schema
export const notificationsSchema = /* GraphQL */ `
  type NotificationSetting {
    event: String!
    label: String!
    enabled: Boolean!
  }

  type NotificationEvent {
    id: ID!
    event: String!
    subject: String!
    toEmail: String!
    success: Boolean!
    errorMessage: String
    createdAt: DateTime!
  }
`;
