import { GraphQLError } from "graphql";
import { requireAdmin, requireAuth } from "./guards";
import {
  assignSubscriptionToProfile,
  countAssignedProfilesByAccount,
  countProfilesByAccount,
  createAccount,
  createProfile,
  deleteAccount,
  deleteProfile,
  getAccountById,
  getAccountLevelAssignment,
  getAccountsByService,
  getAllAccounts,
  getAssignmentsByProfile,
  getAssignmentsBySubscription,
  getProfileById,
  getProfilesByAccount,
  profileIndexExistsInAccount,
  removeAssignment,
  updateAccount,
  updateProfile,
} from "@/lib/db/repositories/accounts.repository";
import { getServiceById } from "@/lib/db/repositories/services.repository";
import type { GraphQLContext } from "../context";

export const accountsResolvers = {
  Query: {
    streamingAccounts: async (
      _: unknown,
      { serviceId }: { serviceId?: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return serviceId ? getAccountsByService(serviceId) : getAllAccounts();
    },
    streamingAccount: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return getAccountById(id);
    },
    streamingProfiles: async (
      _: unknown,
      { accountId }: { accountId: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      return getProfilesByAccount(accountId);
    },
    subscriptionAssignment: async (
      _: unknown,
      { subscriptionId }: { subscriptionId: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      const [row] = await getAssignmentsBySubscription(subscriptionId);
      return row ?? null;
    },
  },

  Mutation: {
    createAccount: async (
      _: unknown,
      { input }: { input: Parameters<typeof createAccount>[0] },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      return createAccount(input);
    },

    updateAccount: async (
      _: unknown,
      { id, input }: { id: string; input: Parameters<typeof updateAccount>[1] },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      if (
        input.maxProfiles !== undefined ||
        input.supportsProfiles !== undefined
      ) {
        const account = await getAccountById(id);
        if (!account)
          throw new GraphQLError("Compte introuvable", {
            extensions: { code: "NOT_FOUND" },
          });

        // Guard: cannot disable profiles while profiles still exist
        if (input.supportsProfiles === false) {
          const currentCount = await countProfilesByAccount(id);
          if (currentCount > 0) {
            throw new GraphQLError(
              `Impossible de désactiver les profils : ${currentCount} profil(s) existent déjà. Supprimez-les d'abord.`,
              { extensions: { code: "VALIDATION_ERROR" } },
            );
          }
        }

        // Guard: cannot reduce maxProfiles below current profile count
        if (input.maxProfiles !== undefined) {
          const effectiveSupports =
            input.supportsProfiles ?? account.supportsProfiles;
          if (effectiveSupports) {
            const currentCount = await countProfilesByAccount(id);
            if (input.maxProfiles < currentCount) {
              throw new GraphQLError(
                `Impossible de réduire le nombre de profils à ${input.maxProfiles} : ${currentCount} profil(s) existent déjà. Supprimez d'abord les profils en trop.`,
                { extensions: { code: "VALIDATION_ERROR" } },
              );
            }
          }
        }
      }
      return updateAccount(id, input);
    },

    deleteAccount: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      return deleteAccount(id);
    },

    createProfile: async (
      _: unknown,
      { input }: { input: Parameters<typeof createProfile>[0] },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      const account = await getAccountById(input.accountId);
      if (!account)
        throw new GraphQLError("Compte introuvable", {
          extensions: { code: "NOT_FOUND" },
        });

      // Guard: platform must support profiles
      if (!account.supportsProfiles) {
        throw new GraphQLError(
          "Ce compte est configuré comme une plateforme sans profils.",
          { extensions: { code: "VALIDATION_ERROR" } },
        );
      }

      // Guard: cannot exceed maxProfiles
      const currentCount = await countProfilesByAccount(input.accountId);
      if (currentCount >= account.maxProfiles) {
        throw new GraphQLError(
          `Ce compte a atteint sa limite de ${account.maxProfiles} profil(s).`,
          { extensions: { code: "VALIDATION_ERROR" } },
        );
      }

      // Guard: profileIndex must be unique within the account
      const idx = input.profileIndex ?? 1;
      if (await profileIndexExistsInAccount(input.accountId, idx)) {
        throw new GraphQLError(
          `La position de profil #${idx} est déjà utilisée sur ce compte.`,
          { extensions: { code: "VALIDATION_ERROR" } },
        );
      }

      // Guard: profileIndex must be within [1, maxProfiles]
      if (idx < 1 || idx > account.maxProfiles) {
        throw new GraphQLError(
          `La position de profil doit être comprise entre 1 et ${account.maxProfiles}.`,
          { extensions: { code: "VALIDATION_ERROR" } },
        );
      }

      return createProfile(input);
    },

    updateProfile: async (
      _: unknown,
      { id, input }: { id: string; input: Parameters<typeof updateProfile>[1] },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      if (input.profileIndex !== undefined) {
        const profile = await getProfileById(id);
        if (!profile)
          throw new GraphQLError("Profil introuvable", {
            extensions: { code: "NOT_FOUND" },
          });
        const account = await getAccountById(profile.accountId);
        if (!account)
          throw new GraphQLError("Compte introuvable", {
            extensions: { code: "NOT_FOUND" },
          });

        // Guard: new profileIndex must be within [1, maxProfiles]
        if (
          input.profileIndex < 1 ||
          input.profileIndex > account.maxProfiles
        ) {
          throw new GraphQLError(
            `La position de profil doit être comprise entre 1 et ${account.maxProfiles}.`,
            { extensions: { code: "VALIDATION_ERROR" } },
          );
        }

        // Guard: profileIndex must be unique within the account (excluding self)
        if (
          await profileIndexExistsInAccount(
            profile.accountId,
            input.profileIndex,
            id,
          )
        ) {
          throw new GraphQLError(
            `La position de profil #${input.profileIndex} est déjà utilisée sur ce compte.`,
            { extensions: { code: "VALIDATION_ERROR" } },
          );
        }
      }
      return updateProfile(id, input);
    },

    deleteProfile: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      return deleteProfile(id);
    },

    assignProfile: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          subscriptionId: string;
          accountId: string;
          profileId?: string | null;
        };
      },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      // Guard: if profileId provided, ensure it belongs to the given account
      if (input.profileId) {
        const profile = await getProfileById(input.profileId);
        if (!profile || profile.accountId !== input.accountId) {
          throw new GraphQLError(
            "Ce profil n'appartient pas au compte sélectionné.",
            { extensions: { code: "VALIDATION_ERROR" } },
          );
        }
        // Guard: profile must not already be assigned
        const existing = await getAssignmentsByProfile(input.profileId);
        if (
          existing.length > 0 &&
          existing[0]!.subscriptionId !== input.subscriptionId
        ) {
          throw new GraphQLError(
            "Ce profil est déjà assigné à un autre abonnement.",
            { extensions: { code: "VALIDATION_ERROR" } },
          );
        }
      }
      return assignSubscriptionToProfile(
        input.subscriptionId,
        input.accountId,
        input.profileId,
      );
    },

    removeAssignment: async (
      _: unknown,
      { subscriptionId }: { subscriptionId: string },
      ctx: GraphQLContext,
    ) => {
      requireAdmin(ctx);
      return removeAssignment(subscriptionId);
    },
  },

  StreamingAccount: {
    service: (parent: { serviceId: string }) =>
      getServiceById(parent.serviceId),
    profiles: (parent: { id: string }) => getProfilesByAccount(parent.id),
    usedProfiles: (parent: { id: string }) =>
      countAssignedProfilesByAccount(parent.id),
    // For accounts where supportsProfiles=false — the subscription is linked directly to the account
    accountAssignment: (parent: { id: string; supportsProfiles: boolean }) =>
      parent.supportsProfiles ? null : getAccountLevelAssignment(parent.id),
  },

  StreamingProfile: {
    assignment: async (parent: { id: string }) => {
      const [row] = await getAssignmentsByProfile(parent.id);
      return row ?? null;
    },
    pin: (parent: { pin?: string | null }) => parent.pin ?? null,
  },
};
