import { AppError } from '@/server/common/errors/app-error';
import { createResourceId } from '@/server/common/utils/resource-id';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import { createSummaryLink } from '@/server/features/settings/repositories/settings.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { GenerateSummaryLinkInput } from '@/server/features/settings/schemas/validators/settings.validators';

export async function generateSummaryLinkUseCase(
  input: GenerateSummaryLinkInput,
  context: GqlContext,
  dependencies: GenerateSummaryLinkDependencies = defaultDependencies
) {
  requireAdmin(context);
  const now = new Date();
  const expiresAt =
    input.expiresInDays === undefined || input.expiresInDays === null
      ? null
      : new Date(now.getTime() + input.expiresInDays * 24 * 60 * 60 * 1000);

  const row = await dependencies.createSummaryLink({
    expiresAt,
    id: dependencies.createId(),
    label: input.label ?? null,
    token: dependencies.createToken(),
  });

  if (row === null) {
    throw new AppError('Could not generate summary link', 500, 'SUMMARY_LINK_CREATE_FAILED');
  }

  return row;
}

interface GenerateSummaryLinkDependencies {
  createId: () => string;
  createSummaryLink: typeof createSummaryLink;
  createToken: () => string;
}

const defaultDependencies: GenerateSummaryLinkDependencies = {
  createId: () => createResourceId('lnk'),
  createSummaryLink,
  createToken: () => createResourceId('sum').replace('sum_', ''),
};
