export type RichTextAttachmentEntity =
  | 'client'
  | 'payment'
  | 'plan'
  | 'promotion'
  | 'service'
  | 'streamingAccount'
  | 'subscription'
  | 'inquiryReply';

export type RichTextFieldName = 'body' | 'description' | 'notes';

export type RichTextAssetDto = {
  id: string;
  publicId: string;
  url: string;
  folder: string;
  contentType: string | null;
  originalName: string | null;
  size: number | null;
  createdAt: string;
};

export type RichTextAssetUploadInput = {
  base64: string;
  filename?: string;
};

export type RichTextAssetUploadResult = {
  asset: RichTextAssetDto | null;
  message: string;
  success: boolean;
};
