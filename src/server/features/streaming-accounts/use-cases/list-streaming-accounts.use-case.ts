import { requireModerator } from '@/server/features/common/guards/require-moderator.guard';
import {
  findAssignmentsByAccountId,
  findStreamingAccounts,
  findProfilesByAccountId,
} from '@/server/features/streaming-accounts/repositories/streaming-accounts.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type {
  StreamingAccountRecord,
  StreamingProfileAssignmentRecord,
  StreamingProfileRecord,
} from '@/server/features/streaming-accounts/schemas/model/streaming-accounts.model';

export async function listStreamingAccountsUseCase(
  context: GqlContext,
  dependencies: ListStreamingAccountsDependencies = defaultDependencies
) {
  requireModerator(context);

  const accounts = await dependencies.findStreamingAccounts();

  return Promise.all(
    accounts.map(async (account) => {
      const [profiles, assignments] = await Promise.all([
        dependencies.findProfilesByAccountId(account.id),
        dependencies.findAssignmentsByAccountId(account.id),
      ]);
      const assignmentByProfileId = new Map(
        assignments
          .filter((assignment) => assignment.profileId !== null)
          .map((assignment) => [assignment.profileId, assignment])
      );

      return {
        ...account,
        profiles: profiles.map((profile) => {
          const assignment = assignmentByProfileId.get(profile.id);
          return {
            ...profile,
            // The assignment row is the only record of *when* the profile was
            // handed over, so it travels with the profile the console lists.
            assignedAt: assignment?.assignedAt ?? null,
            assignmentId: assignment?.id ?? null,
            membershipId: assignment?.membershipId ?? null,
          };
        }),
      };
    })
  );
}

interface ListStreamingAccountsDependencies {
  findStreamingAccounts: () => Promise<StreamingAccountRecord[]>;
  findProfilesByAccountId: (accountId: string) => Promise<StreamingProfileRecord[]>;
  findAssignmentsByAccountId: (accountId: string) => Promise<StreamingProfileAssignmentRecord[]>;
}

const defaultDependencies: ListStreamingAccountsDependencies = {
  findAssignmentsByAccountId,
  findStreamingAccounts,
  findProfilesByAccountId,
};
