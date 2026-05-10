import {
  streamingAccountsFieldResolvers,
  streamingAccountsMutationResolvers,
  streamingAccountsQueryResolvers,
} from '@/modules/accounts/server/graphql/streaming-accounts.resolvers';
import {
  streamingProfilesFieldResolvers,
  streamingProfilesMutationResolvers,
  streamingProfilesQueryResolvers,
} from '@/modules/accounts/server/graphql/streaming-profiles.resolvers';
import {
  profileAssignmentsMutationResolvers,
  profileAssignmentsQueryResolvers,
} from '@/modules/accounts/server/graphql/profile-assignments.resolvers';

export * from '@/modules/accounts/server/graphql/streaming-accounts.resolvers';
export * from '@/modules/accounts/server/graphql/streaming-profiles.resolvers';
export * from '@/modules/accounts/server/graphql/profile-assignments.resolvers';

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
