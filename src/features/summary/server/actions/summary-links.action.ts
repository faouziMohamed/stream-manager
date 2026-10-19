'use server';

import { loadSummaryLinks } from '@/features/summary/server/loaders/summary.loader';
import { requireSession } from '@/lib/auth/require-session';
import { gqlRequest } from '@/lib/graphql/client';
import {
  GenerateSummaryLinkDocument,
  type GenerateSummaryLinkMutation,
  type GenerateSummaryLinkMutationVariables,
  RevokeSummaryLinkDocument,
  type RevokeSummaryLinkMutation,
  type RevokeSummaryLinkMutationVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('summary.links.action');

export async function listSummaryLinksAction() {
  return loadSummaryLinks();
}

export async function generateSummaryLinkAction(options?: {
  label?: string;
  expiresInDays?: number;
}) {
  await requireSession('You must be signed in to manage summary links');
  const input =
    options === undefined
      ? null
      : { label: options.label ?? null, expiresInDays: options.expiresInDays ?? null };
  const data = await gqlRequest<GenerateSummaryLinkMutation, GenerateSummaryLinkMutationVariables>(
    GenerateSummaryLinkDocument,
    { input }
  );

  log.info({ id: data.generateSummaryLink.id }, 'Summary link generated');
  return data.generateSummaryLink;
}

export async function revokeSummaryLinkAction(id: string) {
  await requireSession('You must be signed in to manage summary links');
  const data = await gqlRequest<RevokeSummaryLinkMutation, RevokeSummaryLinkMutationVariables>(
    RevokeSummaryLinkDocument,
    { input: { id } }
  );

  log.info({ id }, 'Summary link revoked');
  return data.revokeSummaryLink;
}
