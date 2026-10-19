import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { listSummaryLinks } from '@/server/features/settings/repositories/settings.repository';

export async function listSummaryLinksUseCase(
  context: GqlContext,
  dependencies: GetSettingsDependencies = defaultDependencies
) {
  requireAdmin(context);
  const rows = await dependencies.listSummaryLinks();

  return rows.map((row) => ({
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    id: row.id,
    label: row.label,
    token: row.token,
  }));
}

interface GetSettingsDependencies {
  listSummaryLinks: typeof listSummaryLinks;
}

const defaultDependencies: GetSettingsDependencies = {
  listSummaryLinks,
};
