export const inquiriesSchema = /* GraphQL */ `
  input CreateInquiryInput {
    name: String!
    email: String
    phone: String
    message: JSON!
  }

  type InquiryReply {
    id: ID!
    inquiryId: ID!
    body: JSON!
    sentAt: DateTime!
  }

  type Inquiry {
    id: ID!
    name: String!
    email: String
    phone: String
    message: JSON!
    isRead: Boolean!
    createdAt: DateTime!
    replies: [InquiryReply!]!
  }
`;
