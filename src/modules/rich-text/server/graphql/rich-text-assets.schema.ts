export const richTextAssetsSchema = /* GraphQL */ `
  type RichTextAsset {
    id: ID!
    publicId: String!
    url: String!
    folder: String!
    contentType: String
    originalName: String
    size: Int
    createdAt: DateTime!
  }

  type RichTextAssetUploadResult {
    success: Boolean!
    message: String!
    asset: RichTextAsset
  }
`;
