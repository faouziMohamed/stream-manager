import { validateInput } from '@/server/features/common/middleware/validate-input';
import {
  assignProfileToMembershipInputSchema,
  createStreamingAccountInputSchema,
  createStreamingProfileInputSchema,
  deleteStreamingAccountInputSchema,
  deleteStreamingProfileInputSchema,
  unassignProfileInputSchema,
  updateStreamingAccountInputSchema,
  updateStreamingProfileInputSchema,
} from '@/server/features/streaming-accounts/schemas/validators/streaming-accounts.validators';
import { assignProfileToMembershipUseCase } from '@/server/features/streaming-accounts/use-cases/assign-profile-to-membership.use-case';
import { createStreamingAccountUseCase } from '@/server/features/streaming-accounts/use-cases/create-streaming-account.use-case';
import { createStreamingProfileUseCase } from '@/server/features/streaming-accounts/use-cases/create-streaming-profile.use-case';
import { deleteStreamingAccountUseCase } from '@/server/features/streaming-accounts/use-cases/delete-streaming-account.use-case';
import { deleteStreamingProfileUseCase } from '@/server/features/streaming-accounts/use-cases/delete-streaming-profile.use-case';
import { getStreamingAccountUseCase } from '@/server/features/streaming-accounts/use-cases/get-streaming-account.use-case';
import { listStreamingAccountsUseCase } from '@/server/features/streaming-accounts/use-cases/list-streaming-accounts.use-case';
import { listStreamingProfilesUseCase } from '@/server/features/streaming-accounts/use-cases/list-streaming-profiles.use-case';
import { unassignProfileUseCase } from '@/server/features/streaming-accounts/use-cases/unassign-profile.use-case';
import { updateStreamingAccountUseCase } from '@/server/features/streaming-accounts/use-cases/update-streaming-account.use-case';
import { updateStreamingProfileUseCase } from '@/server/features/streaming-accounts/use-cases/update-streaming-profile.use-case';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type {
  StreamingAccountRecord,
  StreamingAccountWithProfilesRecord,
  StreamingProfileAssignmentRecord,
  StreamingProfileRecord,
} from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';

export const streamingAccountsResolvers = {
  Mutation: {
    async createStreamingAccount(
      _parent: unknown,
      args: ResolverArgs<unknown>,
      context: GqlContext
    ) {
      const input = validateInput(createStreamingAccountInputSchema, args.input);
      const account = await createStreamingAccountUseCase(input, context);

      return toStreamingAccountDto(account);
    },
    async updateStreamingAccount(
      _parent: unknown,
      args: ResolverArgs<unknown>,
      context: GqlContext
    ) {
      const input = validateInput(updateStreamingAccountInputSchema, args.input);
      const account = await updateStreamingAccountUseCase(input, context);

      return toStreamingAccountDto(account);
    },
    async deleteStreamingAccount(
      _parent: unknown,
      args: ResolverArgs<unknown>,
      context: GqlContext
    ) {
      const input = validateInput(deleteStreamingAccountInputSchema, args.input);
      const account = await deleteStreamingAccountUseCase(input, context);

      return toStreamingAccountDto(account);
    },
    async createStreamingProfile(
      _parent: unknown,
      args: ResolverArgs<unknown>,
      context: GqlContext
    ) {
      const input = validateInput(createStreamingProfileInputSchema, args.input);
      const profile = await createStreamingProfileUseCase(input, context);

      return toStreamingProfileDto(profile);
    },
    async updateStreamingProfile(
      _parent: unknown,
      args: ResolverArgs<unknown>,
      context: GqlContext
    ) {
      const input = validateInput(updateStreamingProfileInputSchema, args.input);
      const profile = await updateStreamingProfileUseCase(input, context);

      return toStreamingProfileDto(profile);
    },
    async deleteStreamingProfile(
      _parent: unknown,
      args: ResolverArgs<unknown>,
      context: GqlContext
    ) {
      const input = validateInput(deleteStreamingProfileInputSchema, args.input);
      const profile = await deleteStreamingProfileUseCase(input, context);

      return toStreamingProfileDto(profile);
    },
    async assignProfileToMembership(
      _parent: unknown,
      args: ResolverArgs<unknown>,
      context: GqlContext
    ) {
      const input = validateInput(assignProfileToMembershipInputSchema, args.input);
      const assignment = await assignProfileToMembershipUseCase(input, context);

      return toAssignmentDto(assignment);
    },
    async unassignProfile(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(unassignProfileInputSchema, args.input);
      const profile = await unassignProfileUseCase(input, context);

      return toStreamingProfileDto(profile);
    },
  },
  Query: {
    async streamingAccounts(_parent: unknown, _args: unknown, context: GqlContext) {
      const accounts = await listStreamingAccountsUseCase(context);

      return accounts.map((account) => toStreamingAccountWithProfilesDto(account));
    },
    async streamingAccount(_parent: unknown, args: IdArg, context: GqlContext) {
      const account = await getStreamingAccountUseCase(args.id, context);

      return toStreamingAccountWithProfilesDto(account);
    },
    async streamingProfiles(_parent: unknown, args: AccountIdArg, context: GqlContext) {
      const profiles = await listStreamingProfilesUseCase(args.accountId, context);

      return profiles.map((profile) => toStreamingProfileDto(profile));
    },
  },
};

function toStreamingAccountDto(account: StreamingAccountRecord) {
  return {
    createdAt: account.createdAt.toISOString(),
    email: account.email,
    id: account.id,
    isActive: account.isActive,
    label: account.label,
    maxProfiles: account.maxProfiles,
    profiles: null,
    serviceId: account.serviceId,
    supportsProfiles: account.supportsProfiles,
    updatedAt: account.updatedAt.toISOString(),
  };
}

function toStreamingAccountWithProfilesDto(account: StreamingAccountWithProfilesRecord) {
  return {
    createdAt: account.createdAt.toISOString(),
    email: account.email,
    id: account.id,
    isActive: account.isActive,
    label: account.label,
    maxProfiles: account.maxProfiles,
    profiles: account.profiles.map((profile) => toStreamingProfileDto(profile)),
    serviceId: account.serviceId,
    supportsProfiles: account.supportsProfiles,
    updatedAt: account.updatedAt.toISOString(),
  };
}

function toStreamingProfileDto(
  profile: StreamingProfileRecord & {
    assignedAt?: Date | null;
    assignmentId?: string | null;
    membershipId?: string | null;
  }
) {
  return {
    accountId: profile.accountId,
    assignedAt: profile.assignedAt?.toISOString() ?? null,
    assignmentId: profile.assignmentId ?? null,
    createdAt: profile.createdAt.toISOString(),
    id: profile.id,
    isAssigned: profile.isAssigned,
    membershipId: profile.membershipId ?? null,
    name: profile.name,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

function toAssignmentDto(assignment: StreamingProfileAssignmentRecord) {
  return {
    accountId: assignment.accountId,
    assignedAt: assignment.assignedAt.toISOString(),
    createdAt: assignment.createdAt.toISOString(),
    id: assignment.id,
    membershipId: assignment.membershipId,
    profileId: assignment.profileId,
  };
}

interface IdArg {
  id: string;
}

interface AccountIdArg {
  accountId: string;
}

interface ResolverArgs<TInput> {
  input: TInput;
}
