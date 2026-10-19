import { findAllMembershipsForSummary } from '@/server/features/memberships/repositories/memberships.repository';
import { findAllPaymentsForSummary } from '@/server/features/payments/repositories/payments.repository';
import { findSummaryLinkByToken } from '@/server/features/settings/repositories/settings.repository';

export async function getSummaryByTokenUseCase(
  token: string,
  dependencies: GetSummaryByTokenDependencies = defaultDependencies
) {
  const link = await dependencies.findSummaryLinkByToken(token);

  if (link === null) return null;
  if (link.expiresAt !== null && link.expiresAt < dependencies.getNow()) return null;

  const [memberships, payments] = await Promise.all([
    dependencies.findAllMembershipsForSummary(),
    dependencies.findAllPaymentsForSummary(),
  ]);

  return { memberships, payments };
}

interface GetSummaryByTokenDependencies {
  findAllMembershipsForSummary: typeof findAllMembershipsForSummary;
  findAllPaymentsForSummary: typeof findAllPaymentsForSummary;
  findSummaryLinkByToken: typeof findSummaryLinkByToken;
  getNow: () => Date;
}

const defaultDependencies: GetSummaryByTokenDependencies = {
  findAllMembershipsForSummary,
  findAllPaymentsForSummary,
  findSummaryLinkByToken,
  getNow: () => new Date(),
};
