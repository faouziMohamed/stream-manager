// Cloudinary settings GraphQL operations

export const GET_CLOUDINARY_SETTINGS = /*graphql*/ `
  query GetCloudinarySettings {
    cloudinarySettings {
      cloudName
      apiKey
      uploadPreset
      folder
      hasApiSecret
    }
  }
`;

export const SET_CLOUDINARY_SETTINGS = /*graphql*/ `
  mutation SetCloudinarySettings($input: CloudinarySettingsInput!) {
    setCloudinarySettings(input: $input) {
      cloudName
      apiKey
      uploadPreset
      folder
      hasApiSecret
    }
  }
`;

export const TEST_CLOUDINARY = /*graphql*/ `
  mutation TestCloudinary {
    testCloudinary {
      success
      message
      publicId
      url
    }
  }
`;

export const UPLOAD_TO_CLOUDINARY = /*graphql*/ `
  mutation UploadToCloudinary($base64: String!, $filename: String) {
    uploadToCloudinary(base64: $base64, filename: $filename) {
      success
      message
      publicId
      url
    }
  }
`;

export const DELETE_FROM_CLOUDINARY = /*graphql*/ `
  mutation DeleteFromCloudinary($publicId: String!) {
    deleteFromCloudinary(publicId: $publicId) {
      success
      message
    }
  }
`;

export const REPLACE_CLOUDINARY_IMAGE = /*graphql*/ `
  mutation ReplaceCloudinaryImage(
    $oldPublicId: String!
    $base64: String!
    $filename: String
  ) {
    replaceCloudinaryImage(
      oldPublicId: $oldPublicId
      base64: $base64
      filename: $filename
    ) {
      success
      message
      publicId
      url
    }
  }
`;

export const GET_CLOUDINARY_MEDIA = /*graphql*/ `
  query GetCloudinaryMedia($folder: String) {
    cloudinaryMedia(folder: $folder) {
      publicId
      url
      format
      width
      height
      bytes
      folder
      createdAt
    }
  }
`;

export interface CloudinarySettingsDto {
  cloudName: string | null;
  apiKey: string | null;
  uploadPreset: string | null;
  folder: string | null;
  hasApiSecret: boolean;
}

export interface CloudinarySettingsInput {
  cloudName: string;
  apiKey: string;
  apiSecret?: string;
  uploadPreset?: string;
  folder?: string;
}

export interface CloudinaryResourceDto {
  publicId: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  folder: string;
  createdAt: string;
}

export interface CloudinaryTestResultDto {
  success: boolean;
  message: string;
  publicId: string | null;
  url: string | null;
}
