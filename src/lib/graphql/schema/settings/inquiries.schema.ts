// Contact inquiries schema
export const inquiriesSchema = /* GraphQL */ `
  input CreateInquiryInput {
    name: String!
    email: String
    phone: String
    message: String!
  }

  type InquiryReply {
    id: ID!
    inquiryId: ID!
    body: String!
    sentAt: DateTime!
  }

  type Inquiry {
    id: ID!
    name: String!
    email: String
    phone: String
    message: String!
    isRead: Boolean!
    createdAt: DateTime!
    replies: [InquiryReply!]!
  }
`;
