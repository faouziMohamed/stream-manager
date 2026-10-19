export const documentsTypeDefs = /* GraphQL */ `
  type GeneratedDocument {
    """
    The PDF as base64, which is what a Server Action can carry.
    """
    base64: String!
    filename: String!
  }

  input GenerateDocumentInput {
    customerId: ID!
    """
    bill covers what is owed; receipt covers what was paid.
    """
    kind: String!
    paymentIds: [ID!]!
  }

  extend type Mutation {
    generateDocument(input: GenerateDocumentInput!): GeneratedDocument!
  }
`;
