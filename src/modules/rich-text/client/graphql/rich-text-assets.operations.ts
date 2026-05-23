export type {
  RichTextAssetDto,
  RichTextAssetUploadResult,
} from '@/modules/rich-text/common/rich-text-assets.types';

export const CLEANUP_RICH_TEXT_ASSETS = /* GraphQL */ `
  mutation CleanupRichTextAssets($publicIds: [String!]!) {
    cleanupRichTextAssets(publicIds: $publicIds)
  }
`;

export const UPLOAD_RICH_TEXT_ASSET = /* GraphQL */ `
  mutation UploadRichTextAsset($base64: String!, $filename: String) {
    uploadRichTextAsset(base64: $base64, filename: $filename) {
      success
      message
      asset {
        id
        publicId
        url
        folder
        contentType
        originalName
        size
        createdAt
      }
    }
  }
`;
