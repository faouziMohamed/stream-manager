import { AppError } from '@/server/common/errors/app-error';
import { paginationMeta } from '@/server/common/utils/pagination';
import { requireModerator } from '@/server/features/common/guards/require-moderator.guard';
import {
  findMembershipById,
  findMemberships,
} from '@/server/features/memberships/repositories/memberships.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { PaginatedResult } from '@/server/features/common/schemas/model/pagination.model';
import type { MembershipFilters } from '@/server/features/memberships/schemas/validators/memberships.validators';
import type { MembershipRecord } from '@/server/features/memberships/use-cases/membership-records.model';

export async function getMembershipsUseCase(
  input: MembershipFilters,
  context: GqlContext,
  dependencies: GetMembershipsDependencies = defaultDependencies
): Promise<PaginatedResult<ReturnType<typeof toMembershipDto>>> {
  requireModerator(context);

  const result = await dependencies.findMemberships(input);

  return {
    items: result.items.map((membership) => toMembershipDto(membership)),
    pageInfo: paginationMeta(result.total, input.page, input.pageSize),
  };
}

export async function getMembershipUseCase(
  id: string,
  context: GqlContext,
  dependencies: GetMembershipDependencies = defaultGetMembershipDependencies
) {
  requireModerator(context);

  const membership = await dependencies.findMembershipById(id);

  if (membership === null) {
    throw new AppError('Membership not found', 404, 'MEMBERSHIP_NOT_FOUND');
  }

  return toMembershipDto(membership);
}

interface FindMembershipsResult {
  items: MembershipRecord[];
  total: number;
}

interface GetMembershipsDependencies {
  findMemberships: (input: MembershipFilters) => Promise<FindMembershipsResult>;
}

interface GetMembershipDependencies {
  findMembershipById: (id: string) => Promise<MembershipRecord | null>;
}

function toMembershipDto(membership: MembershipRecord) {
  return {
    businessId: membership.businessId,
    createdAt: membership.createdAt.toISOString(),
    customerId: membership.customerId,
    endDate: membership.endDate,
    id: membership.id,
    isRecurring: membership.isRecurring,
    planId: membership.planId,
    renewedFromId: membership.renewedFromId,
    startDate: membership.startDate,
    status: membership.status,
    updatedAt: membership.updatedAt.toISOString(),
  };
}

const defaultDependencies: GetMembershipsDependencies = {
  findMemberships,
};

const defaultGetMembershipDependencies: GetMembershipDependencies = {
  findMembershipById,
};
