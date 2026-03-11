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

    type CloudinarySettings {
        cloudName: String
        apiKey: String
        uploadPreset: String
        folder: String
        hasApiSecret: Boolean!
    }

    input CloudinarySettingsInput {
        cloudName: String!
        apiKey: String!
        apiSecret: String
        uploadPreset: String
        folder: String
    }

    type TestResult {
        success: Boolean!
        message: String!
    }

    type CloudinaryTestResult {
        success: Boolean!
        message: String!
        publicId: String
        url: String
    }

    type CloudinaryResource {
        publicId: String!
        url: String!
        format: String!
        width: Int!
        height: Int!
        bytes: Int!
        folder: String!
        createdAt: String!
    }

    input CreateInquiryInput {
        name: String!
        email: String
        phone: String
        message: String!
    }
`;
