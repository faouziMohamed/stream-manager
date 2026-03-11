export const GET_INQUIRIES = /*graphql*/ `
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

export const MARK_INQUIRY_READ = /*graphql*/ `
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

export const REPLY_TO_INQUIRY = /*graphql*/ `
  mutation ReplyToInquiry($id: ID!, $body: String!) {
    replyToInquiry(id: $id, body: $body) {
      id
      inquiryId
      body
      sentAt
    }
  }
`;

export const DELETE_INQUIRY = /*graphql*/ `
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
