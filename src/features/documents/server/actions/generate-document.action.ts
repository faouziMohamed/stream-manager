'use server';

import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import {
  GenerateDocumentDocument,
  type GenerateDocumentMutation,
  type GenerateDocumentMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('documents.generate.action');

/**
 * Builds the PDF and hands it back as base64.
 *
 * A Server Action rather than a route handler: this repo has one HTTP surface
 * (GraphQL) and a document is an operation, not an endpoint. Base64 because a
 * Server Action serialises its return value and a Uint8Array does not survive
 * that trip intact.
 */
export async function generateDocumentAction(input: GenerateDocumentActionInput) {
  const session = await auth();

  if (session === null || session.user?.id === undefined) {
    throw new Error('You must be signed in to generate documents');
  }

  try {
    const data = await gqlRequest<GenerateDocumentMutation, GenerateDocumentMutationVariables>(
      GenerateDocumentDocument,
      { input }
    );

    log.info({ customerId: input.customerId, kind: input.kind }, 'Document generated');
    return {
      filename: data.generateDocument.filename,
      ok: true as const,
      base64: data.generateDocument.base64,
    };
  } catch (error) {
    log.error(
      {
        customerId: input.customerId,
        error: error instanceof Error ? error.message : String(error),
        kind: input.kind,
      },
      'Failed to generate document'
    );

    // Returned, not thrown: Next redacts thrown Server Action errors in
    // production, so "A bill can only cover payments that are still owed"
    // would reach the operator as "An error occurred in the Server Components
    // render" instead of telling them what to change.
    return {
      error: error instanceof Error ? error.message : 'The document could not be generated',
      ok: false as const,
    };
  }
}

export type GenerateDocumentActionInput = {
  customerId: string;
  kind: 'bill' | 'receipt';
  paymentIds: string[];
};
