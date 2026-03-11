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

    input CreateInquiryInput {
        name: String!
        email: String
        phone: String
        message: String!
    }
`;
