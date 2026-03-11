// Barrel export for all accounts resolvers
// Barrel export for all accounts resolvers
import {
  streamingAccountsFieldResolvers,
  streamingAccountsMutationResolvers,
  streamingAccountsQueryResolvers,
} from "@/lib/graphql/resolvers/accounts/streaming-accounts.resolvers";
import {
  streamingProfilesFieldResolvers,
  streamingProfilesMutationResolvers,
  streamingProfilesQueryResolvers,
} from "@/lib/graphql/resolvers/accounts/streaming-profiles.resolvers";
import {
  profileAssignmentsMutationResolvers,
  profileAssignmentsQueryResolvers,
} from "@/lib/graphql/resolvers/accounts/profile-assignments.resolvers";

export const accountsResolvers = {
  Query: {
    ...streamingAccountsQueryResolvers,
    ...streamingProfilesQueryResolvers,
    ...profileAssignmentsQueryResolvers,
  },
  Mutation: {
    ...streamingAccountsMutationResolvers,
    ...streamingProfilesMutationResolvers,
    ...profileAssignmentsMutationResolvers,
  },
  ...streamingAccountsFieldResolvers,
  ...streamingProfilesFieldResolvers,
};
