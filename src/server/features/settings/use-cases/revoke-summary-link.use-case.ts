import { AppError } from '@/server/common/errors/app-error';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { deleteSummaryLinkById } from '@/server/features/settings/repositories/settings.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { RevokeSummaryLinkInput } from '@/server/features/settings/schemas/validators/settings.validators';

export async function revokeSummaryLinkUseCase(
  input: RevokeSummaryLinkInput,
  context: GqlContext,
  dependencies: RevokeSummaryLinkDependencies = defaultDependencies
) {
  requireAdmin(context);
  const row = await dependencies.deleteSummaryLinkById(input.id);

  if (row === null) {
    throw new AppError('Summary link not found', 404, 'SUMMARY_LINK_NOT_FOUND');
  }

  return true;
}

interface RevokeSummaryLinkDependencies {
  deleteSummaryLinkById: typeof deleteSummaryLinkById;
}

const defaultDependencies: RevokeSummaryLinkDependencies = {
  deleteSummaryLinkById,
};
