import { AppError } from '@/server/common/errors/app-error';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  cancelMembershipWithPendingPayments,
  findMembershipById,
} from '@/server/features/memberships/repositories/memberships.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { CancelMembershipInput } from '@/server/features/memberships/schemas/validators/memberships.validators';
import type { MembershipRecord } from '@/server/features/memberships/use-cases/membership-records.model';
import { todayIsoDate } from '@/lib/utils/iso-date';

export async function cancelMembershipUseCase(
  input: CancelMembershipInput,
  context: GqlContext,
  dependencies: CancelMembershipDependencies = defaultDependencies
) {
  requireAdmin(context);

  if (!input.confirmed) {
    throw new AppError(
      'confirmed: true is required to cancel',
      400,
      'MEMBERSHIP_CANCEL_CONFIRMATION_REQUIRED'
    );
  }

  const existingMembership = await dependencies.findMembershipById(input.id);

  if (existingMembership === null) {
    throw new AppError('Membership not found', 404, 'MEMBERSHIP_NOT_FOUND');
  }

  const membership = await dependencies.cancelMembershipWithPendingPayments(
    input.id,
    dependencies.today()
  );

  if (membership === null) {
    throw new AppError('Membership could not be cancelled', 500, 'MEMBERSHIP_CANCEL_FAILED');
  }

  return membership;
}

interface CancelMembershipDependencies {
  cancelMembershipWithPendingPayments: (
    id: string,
    today: string
  ) => Promise<MembershipRecord | null>;
  findMembershipById: (id: string) => Promise<MembershipRecord | null>;
  today: () => string;
}

const defaultDependencies: CancelMembershipDependencies = {
  cancelMembershipWithPendingPayments,
  findMembershipById,
  today: () => todayIsoDate(),
};
