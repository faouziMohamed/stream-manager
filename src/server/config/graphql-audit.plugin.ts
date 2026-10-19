import { getOperationAST } from 'graphql';
import type { Plugin } from 'graphql-yoga';

import type { AuditActor } from '@/server/features/audit/repositories/audit.repository';
import { recordAuditEvent } from '@/server/features/audit/repositories/audit.repository';
import { redactAuditValue } from '@/server/features/audit/shared/audit-redaction';

/**
 * One audit row per successful GraphQL mutation.
 *
 * Recording at the resolver layer would mean touching every use case and
 * missing the next one; the operation itself is the unit the caller invoked.
 * The operation name is the action, the context names the actor, and the
 * variables are kept redacted. Mutations that return errors leave no row —
 * nothing happened that a reader should attribute to anyone.
 */
export function createAuditLogPlugin(): Plugin {
  return {
    onExecute({ args }) {
      const operation = getOperationAST(args.document, args.operationName ?? null);

      if (operation?.operation !== 'mutation') return;

      const action = operation.name?.value ?? 'anonymous-mutation';
      const actor = actorFromContext(args.contextValue);
      const variables = isRecord(args.variableValues) ? args.variableValues : {};

      return {
        async onExecuteDone({ result }) {
          if ('errors' in result && result.errors !== undefined && result.errors.length > 0) {
            return;
          }

          await recordAuditEvent({
            action,
            actor,
            entityId: extractEntityId(variables),
            entityType: entityTypeFor(action),
            metadata: { variables: redactAuditValue(variables) },
          });
        },
      };
    },
  };
}

function actorFromContext(context: unknown): AuditActor | null {
  if (!isRecord(context) || !isRecord(context.user)) return null;

  const { email, id, role } = context.user;

  return {
    email: typeof email === 'string' ? email : null,
    id: typeof id === 'string' ? id : null,
    role: typeof role === 'string' ? role : null,
  };
}

/** The first domain id the caller named, so an event can be followed to its row. */
function extractEntityId(variables: Record<string, unknown>): string | null {
  const input = isRecord(variables.input) ? variables.input : undefined;
  const candidates = [
    input?.id,
    input?.membershipId,
    input?.profileId,
    input?.customerId,
    input?.planId,
    variables.id,
  ];

  return candidates.find((value): value is string => typeof value === 'string') ?? null;
}

const ENTITY_BY_OPERATION: Record<string, string> = {
  ArchiveCustomer: 'customer',
  ArchiveService: 'service',
  AssignProfileToMembership: 'profile-assignment',
  CancelMembership: 'membership',
  CreateCustomer: 'customer',
  CreateMembership: 'membership',
  CreatePayment: 'payment',
  CreatePlan: 'plan',
  CreateService: 'service',
  CreateStreamingAccount: 'streaming-account',
  CreateStreamingProfile: 'streaming-profile',
  CreateSubscription: 'subscription',
  DeleteMediaAsset: 'media-asset',
  DeletePlan: 'plan',
  DeleteStreamingAccount: 'streaming-account',
  DeleteStreamingProfile: 'streaming-profile',
  DeleteUser: 'user',
  GenerateDocument: 'document',
  GenerateSummaryLink: 'summary-link',
  LogoutUserDevices: 'user-session',
  MarkPaymentPaid: 'payment',
  RenewMembership: 'membership',
  RestoreService: 'service',
  RevokeSession: 'user-session',
  RevokeSummaryLink: 'summary-link',
  UnassignProfile: 'profile-assignment',
  UpdateCustomer: 'customer',
  UpdatePlan: 'plan',
  UpdateService: 'service',
  UpdateStreamingAccount: 'streaming-account',
  UpdateStreamingProfile: 'streaming-profile',
  UpdateUserRole: 'user',
  UploadMedia: 'media-asset',
};

function entityTypeFor(action: string): string | null {
  return ENTITY_BY_OPERATION[action] ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
