import { GraphQLError } from 'graphql';
import { requireAdmin, requireAuth } from '@/lib/graphql/resolvers/guards';
import {
  countAssignedProfilesByAccount,
  createAccount,
  deleteAccount,
  getAccountById,
  getAccountLevelAssignment,
  getAccountsByService,
  getAllAccounts,
  updateAccount,
} from '@/modules/accounts/server/repositories/streaming-accounts.repository';
import {
  countProfilesByAccount,
  getProfilesByAccount,
} from '@/modules/accounts/server/repositories/streaming-profiles.repository';
import { getServiceById } from '@/modules/services/server/repositories/services.repository';
import { createLogger } from '@/lib/logger';
import type { GraphQLContext } from '@/lib/graphql/context';
import { reconcileSavedRichTextField } from '@/modules/rich-text/server/services/rich-text-assets.service';

const logger = createLogger('streaming-accounts-resolvers');

export const streamingAccountsQueryResolvers = {
  streamingAccounts: async (
    _: unknown,
    { serviceId }: { serviceId?: string },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx);
    return serviceId ? getAccountsByService(serviceId) : getAllAccounts();
  },
  streamingAccount: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requireAuth(ctx);
    return getAccountById(id);
  },
};

export const streamingAccountsMutationResolvers = {
  createAccount: async (
    _: unknown,
    { input }: { input: Parameters<typeof createAccount>[0] },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    const account = await createAccount(input);
    await reconcileSavedRichTextField({
      entityId: account.id,
      entityType: 'streamingAccount',
      fieldName: 'notes',
      previousValue: null,
      nextValue: account.notes,
    });
    logger.info({ id: account.id, serviceId: input.serviceId }, 'Account created');
    return account;
  },

  updateAccount: async (
    _: unknown,
    { id, input }: { id: string; input: Parameters<typeof updateAccount>[1] },
    ctx: GraphQLContext
  ) => {
    requireAdmin(ctx);
    const previous = await getAccountById(id);
    if (input.maxProfiles !== undefined || input.supportsProfiles !== undefined) {
      const account = previous;
      if (!account)
        throw new GraphQLError('Compte introuvable', {
          extensions: { code: 'NOT_FOUND' },
        });

      if (input.supportsProfiles === false) {
        const currentCount = await countProfilesByAccount(id);
        if (currentCount > 0) {
          throw new GraphQLError(
            `Impossible de désactiver les profils : ${currentCount} profil(s) existent déjà. Supprimez-les d'abord.`,
            { extensions: { code: 'VALIDATION_ERROR' } }
          );
        }
      }

      if (input.maxProfiles !== undefined) {
        const effectiveSupports = input.supportsProfiles ?? account.supportsProfiles;
        if (effectiveSupports) {
          const currentCount = await countProfilesByAccount(id);
          if (input.maxProfiles < currentCount) {
            throw new GraphQLError(
              `Impossible de réduire le nombre de profils à ${input.maxProfiles} : ${currentCount} profil(s) existent déjà. Supprimez d'abord les profils en trop.`,
              { extensions: { code: 'VALIDATION_ERROR' } }
            );
          }
        }
      }
    }
    logger.info({ id }, 'Account updated');
    const account = await updateAccount(id, input);
    if (account) {
      await reconcileSavedRichTextField({
        entityId: account.id,
        entityType: 'streamingAccount',
        fieldName: 'notes',
        previousValue: previous?.notes,
        nextValue: account.notes,
      });
    }
    return account;
  },

  deleteAccount: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requireAdmin(ctx);
    await deleteAccount(id);
    logger.info({ id }, 'Account deleted');
    return true;
  },
};

export const streamingAccountsFieldResolvers = {
  StreamingAccount: {
    service: (parent: { serviceId: string }) => getServiceById(parent.serviceId),
    profiles: (parent: { id: string }) => getProfilesByAccount(parent.id),
    usedProfiles: (parent: { id: string }) => countAssignedProfilesByAccount(parent.id),
    accountAssignment: (parent: { id: string; supportsProfiles: boolean }) =>
      parent.supportsProfiles ? null : getAccountLevelAssignment(parent.id),
  },
};
