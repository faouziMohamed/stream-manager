import { GraphQLError } from "graphql";
import { requireAdmin, requireAuth } from "@/lib/graphql/resolvers/guards";
import {
  assignSubscriptionToProfile,
  getAssignmentsByProfile,
  getAssignmentsBySubscription,
  getProfileById,
  removeAssignment,
} from "@/lib/db/repositories/accounts";
import { createLogger } from "@/lib/logger";
import type { GraphQLContext } from "@/lib/graphql/context";

const logger = createLogger("profile-assignments-resolvers");

export const profileAssignmentsQueryResolvers = {
  subscriptionAssignment: async (
    _: unknown,
    { subscriptionId }: { subscriptionId: string },
    ctx: GraphQLContext,
  ) => {
    requireAuth(ctx);
    const [row] = await getAssignmentsBySubscription(subscriptionId);
    return row ?? null;
  },
};

export const profileAssignmentsMutationResolvers = {
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
    if (input.profileId) {
      const profile = await getProfileById(input.profileId);
      if (!profile || profile.accountId !== input.accountId) {
        throw new GraphQLError(
          "Ce profil n'appartient pas au compte sélectionné.",
          { extensions: { code: "VALIDATION_ERROR" } },
        );
      }
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
    logger.info(
      { subscriptionId: input.subscriptionId, profileId: input.profileId },
      "Profile assigned to subscription",
    );
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
    await removeAssignment(subscriptionId);
    logger.info({ subscriptionId }, "Assignment removed");
    return true;
  },
};
