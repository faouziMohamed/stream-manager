// Settings GraphQL operations
export const GET_DEFAULT_CURRENCY = /* GraphQL */ `
  query GetDefaultCurrency {
    defaultCurrency
  }
`;

export const GET_APP_SETTING = /* GraphQL */ `
  query GetAppSetting($key: String!) {
    appSetting(key: $key) {
      key
      value
    }
  }
`;

export const SET_APP_SETTING = /* GraphQL */ `
  mutation SetAppSetting($key: String!, $value: String!) {
    setAppSetting(key: $key, value: $value) {
      key
      value
    }
  }
`;

export const GET_SUMMARY_LINKS = /* GraphQL */ `
  query GetSummaryLinks {
    summaryLinks {
      id
      token
      label
      showSensitiveInfo
      isActive
      expiresAt
      shareUrl
      createdAt
    }
  }
`;

export const CREATE_SUMMARY_LINK = /* GraphQL */ `
  mutation CreateSummaryLink(
    $label: String
    $showSensitiveInfo: Boolean!
    $expiresAt: DateTime
  ) {
    createSummaryLink(
      label: $label
      showSensitiveInfo: $showSensitiveInfo
      expiresAt: $expiresAt
    ) {
      id
      token
      label
      showSensitiveInfo
      isActive
      expiresAt
      shareUrl
      createdAt
    }
  }
`;

export const DELETE_SUMMARY_LINK = /* GraphQL */ `
  mutation DeleteSummaryLink($id: ID!) {
    deleteSummaryLink(id: $id)
  }
`;

export const TOGGLE_SUMMARY_LINK = /* GraphQL */ `
  mutation ToggleSummaryLink($id: ID!, $isActive: Boolean!) {
    toggleSummaryLink(id: $id, isActive: $isActive) {
      id
      isActive
      shareUrl
    }
  }
`;

export const GET_SMTP_SETTINGS = /* GraphQL */ `
  query GetSmtpSettings {
    smtpSettings {
      host
      port
      secure
      user
      senderEmail
      senderName
      hasPassword
    }
  }
`;

export const SET_SMTP_SETTINGS = /* GraphQL */ `
  mutation SetSmtpSettings($input: SmtpSettingsInput!) {
    setSmtpSettings(input: $input) {
      host
      port
      secure
      user
      senderEmail
      senderName
      hasPassword
    }
  }
`;

export interface SmtpSettingsDto {
  host: string | null;
  port: number | null;
  secure: boolean | null;
  user: string | null;
  senderEmail: string | null;
  senderName: string | null;
  hasPassword: boolean;
}

export interface SmtpSettingsInput {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
  senderEmail: string;
  senderName: string;
}

export const GET_CLOUDINARY_SETTINGS = /* GraphQL */ `
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

export const SET_CLOUDINARY_SETTINGS = /* GraphQL */ `
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

export const TEST_SMTP = /* GraphQL */ `
  mutation TestSmtp($toEmail: String!) {
    testSmtp(toEmail: $toEmail) {
      success
      message
    }
  }
`;

export const TEST_CLOUDINARY = /* GraphQL */ `
  mutation TestCloudinary {
    testCloudinary {
      success
      message
      publicId
      url
    }
  }
`;

export const UPLOAD_TO_CLOUDINARY = /* GraphQL */ `
  mutation UploadToCloudinary($base64: String!, $filename: String) {
    uploadToCloudinary(base64: $base64, filename: $filename) {
      success
      message
      publicId
      url
    }
  }
`;

export const DELETE_FROM_CLOUDINARY = /* GraphQL */ `
  mutation DeleteFromCloudinary($publicId: String!) {
    deleteFromCloudinary(publicId: $publicId) {
      success
      message
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

export const REPLACE_CLOUDINARY_IMAGE = /* GraphQL */ `
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

export const GET_CLOUDINARY_MEDIA = /* GraphQL */ `
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

export interface TestResultDto {
  success: boolean;
  message: string;
}

export interface CloudinaryTestResultDto {
  success: boolean;
  message: string;
  publicId: string | null;
  url: string | null;
}

export interface AppSettingDto {
  key: string;
  value: string;
}

export interface SummaryLinkDto {
  id: string;
  token: string;
  label: string | null;
  showSensitiveInfo: boolean;
  isActive: boolean;
  expiresAt: string | null;
  shareUrl: string;
  createdAt: string;
}

export const GET_INQUIRIES = /* GraphQL */ `
  query GetInquiries($unreadOnly: Boolean) {
    inquiries(unreadOnly: $unreadOnly) {
      id
      name
      email
      phone
      message
      isRead
      createdAt
      replies {
        id
        inquiryId
        body
        sentAt
      }
    }
  }
`;

export const MARK_INQUIRY_READ = /* GraphQL */ `
  mutation MarkInquiryRead($id: ID!, $isRead: Boolean!) {
    markInquiryRead(id: $id, isRead: $isRead) {
      id
      name
      email
      phone
      message
      isRead
      createdAt
      replies {
        id
        inquiryId
        body
        sentAt
      }
    }
  }
`;

export const REPLY_TO_INQUIRY = /* GraphQL */ `
  mutation ReplyToInquiry($id: ID!, $body: String!) {
    replyToInquiry(id: $id, body: $body) {
      id
      inquiryId
      body
      sentAt
    }
  }
`;

export const DELETE_INQUIRY = /* GraphQL */ `
  mutation DeleteInquiry($id: ID!) {
    deleteInquiry(id: $id)
  }
`;

export interface InquiryReplyDto {
  id: string;
  inquiryId: string;
  body: string;
  sentAt: string;
}

export interface InquiryDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  replies: InquiryReplyDto[];
}
