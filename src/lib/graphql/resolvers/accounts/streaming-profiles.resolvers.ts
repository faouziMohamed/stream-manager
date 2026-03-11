import { GraphQLError } from "graphql";
import { requireAdmin, requireAuth } from "@/lib/graphql/resolvers/guards";
import {
  countProfilesByAccount,
  createProfile,
  deleteProfile,
  getAccountById,
  getAssignmentsByProfile,
  getProfileById,
  profileIndexExistsInAccount,
  updateProfile,
} from "@/lib/db/repositories/accounts";
import { createLogger } from "@/lib/logger";
import type { GraphQLContext } from "@/lib/graphql/context";

const logger = createLogger("streaming-profiles-resolvers");

export const streamingProfilesQueryResolvers = {
  streamingProfiles: async (
    _: unknown,
    { accountId }: { accountId: string },
    ctx: GraphQLContext,
  ) => {
    requireAuth(ctx);
    // No direct query in the original, but provided for completeness
    return [];
  },
};

export const streamingProfilesMutationResolvers = {
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

    if (!account.supportsProfiles) {
      throw new GraphQLError(
        "Ce compte est configuré comme une plateforme sans profils.",
        { extensions: { code: "VALIDATION_ERROR" } },
      );
    }

    const currentCount = await countProfilesByAccount(input.accountId);
    if (currentCount >= account.maxProfiles) {
      throw new GraphQLError(
        `Ce compte a atteint sa limite de ${account.maxProfiles} profil(s).`,
        { extensions: { code: "VALIDATION_ERROR" } },
      );
    }

    const idx = input.profileIndex ?? 1;
    if (await profileIndexExistsInAccount(input.accountId, idx)) {
      throw new GraphQLError(
        `La position de profil #${idx} est déjà utilisée sur ce compte.`,
        { extensions: { code: "VALIDATION_ERROR" } },
      );
    }

    if (idx < 1 || idx > account.maxProfiles) {
      throw new GraphQLError(
        `La position de profil doit être comprise entre 1 et ${account.maxProfiles}.`,
        { extensions: { code: "VALIDATION_ERROR" } },
      );
    }

    const profile = await createProfile(input);
    logger.info(
      { id: profile.id, accountId: input.accountId },
      "Profile created",
    );
    return profile;
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

      if (input.profileIndex < 1 || input.profileIndex > account.maxProfiles) {
        throw new GraphQLError(
          `La position de profil doit être comprise entre 1 et ${account.maxProfiles}.`,
          { extensions: { code: "VALIDATION_ERROR" } },
        );
      }

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
    logger.info({ id }, "Profile updated");
    return updateProfile(id, input);
  },

  deleteProfile: async (
    _: unknown,
    { id }: { id: string },
    ctx: GraphQLContext,
  ) => {
    requireAdmin(ctx);
    await deleteProfile(id);
    logger.info({ id }, "Profile deleted");
    return true;
  },
};

export const streamingProfilesFieldResolvers = {
  StreamingProfile: {
    assignment: async (parent: { id: string }) => {
      const [row] = await getAssignmentsByProfile(parent.id);
      return row ?? null;
    },
    pin: (parent: { pin?: string | null }) => parent.pin ?? null,
  },
};
