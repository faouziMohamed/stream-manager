// Cloudinary settings schema
export const cloudinarySettingsSchema = /* GraphQL */ `
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
`;
