// SMTP settings schema
export const smtpSettingsSchema = /* GraphQL */ `
  type SmtpSettings {
    host: String
    port: Int
    secure: Boolean
    user: String
    senderEmail: String
    senderName: String
    hasPassword: Boolean!
  }

  input SmtpSettingsInput {
    host: String!
    port: Int!
    secure: Boolean!
    user: String!
    password: String
    senderEmail: String!
    senderName: String!
  }

  type TestResult {
    success: Boolean!
    message: String!
  }
`;
