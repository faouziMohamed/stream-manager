import { GraphQLError, GraphQLScalarType } from 'graphql';

import { validateInput } from '@/server/features/common/middleware/validate-input';
import { generateSummaryLinkUseCase } from '@/server/features/settings/use-cases/generate-summary-link.use-case';
import { getSummaryByTokenUseCase } from '@/server/features/settings/use-cases/get-summary-by-token.use-case';
import { deleteMediaAssetUseCase } from '@/server/features/settings/use-cases/delete-media-asset.use-case';
import { listSummaryLinksUseCase } from '@/server/features/settings/use-cases/get-settings.use-case';
import { revokeSummaryLinkUseCase } from '@/server/features/settings/use-cases/revoke-summary-link.use-case';
import { listMediaAssetsUseCase } from '@/server/features/settings/use-cases/list-media-assets.use-case';
import { uploadMediaUseCase } from '@/server/features/settings/use-cases/upload-media.use-case';
import {
  generateSummaryLinkInputSchema,
  deleteMediaAssetInputSchema,
  listMediaAssetsInputSchema,
  revokeSummaryLinkInputSchema,
} from '@/server/features/settings/schemas/validators/settings.validators';
import {
  DEFAULT_MEDIA_CATEGORY,
  isMediaCategory,
} from '@/server/features/settings/schemas/model/media-category.model';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { UploadedFile } from '@/server/features/settings/use-cases/upload-media.use-case';

// Input-only scalar: graphql-yoga substitutes the multipart file part as a
// WHATWG File, which we pass straight through to the use-case.
const uploadScalar = new GraphQLScalarType({
  name: 'Upload',
  parseValue: (value) => value,
  parseLiteral() {
    throw new GraphQLError('Upload must be provided as a multipart file, not a literal');
  },
  serialize() {
    throw new GraphQLError('Upload is an input-only scalar and cannot be serialized');
  },
});

export const settingsResolvers = {
  Upload: uploadScalar,
  Query: {
    async mediaAssets(
      _parent: unknown,
      args: ResolverArgs<unknown> | undefined,
      context: GqlContext
    ) {
      const input = validateInput(listMediaAssetsInputSchema, args?.input ?? {});
      return listMediaAssetsUseCase(input, context);
    },
    async summaryLinks(_parent: unknown, _args: unknown, context: GqlContext) {
      return listSummaryLinksUseCase(context);
    },
    async summaryByToken(_parent: unknown, args: { token: string }) {
      const result = await getSummaryByTokenUseCase(args.token);
      if (result === null) return null;
      return {
        memberships: result.memberships.map((m) => ({
          businessId: m.businessId,
          customerName: m.customerName,
          endDate: m.endDate,
          id: m.id,
          isRecurring: m.isRecurring,
          planName: m.planName,
          startDate: m.startDate,
          status: m.status,
        })),
        payments: result.payments.map((p) => ({
          amount: p.amount,
          businessId: p.businessId,
          currencyCode: p.currencyCode,
          customerName: p.customerName,
          dueDate: p.dueDate,
          id: p.id,
          method: p.method ?? null,
          paidDate: p.paidDate ?? null,
          status: p.status,
        })),
      };
    },
  },
  Mutation: {
    async deleteMediaAsset(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(deleteMediaAssetInputSchema, args.input);
      const asset = await deleteMediaAssetUseCase(input.id, context);
      return { id: asset.id };
    },
    async generateSummaryLink(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(generateSummaryLinkInputSchema, args.input ?? {});
      const row = await generateSummaryLinkUseCase(input, context);
      return toSummaryLinkDto(row);
    },
    async revokeSummaryLink(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(revokeSummaryLinkInputSchema, args.input);
      return revokeSummaryLinkUseCase(input, context);
    },
    async uploadMedia(_parent: unknown, args: UploadMediaArgs, context: GqlContext) {
      if (!isUploadedFile(args.file)) {
        throw new GraphQLError('A file is required to upload media');
      }
      const category = isMediaCategory(args.category) ? args.category : DEFAULT_MEDIA_CATEGORY;
      return uploadMediaUseCase({ category, file: args.file }, context);
    },
  },
};

function toSummaryLinkDto(row: {
  createdAt: Date;
  expiresAt: Date | null;
  id: string;
  label: string | null;
  token: string;
}) {
  return {
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    id: row.id,
    label: row.label,
    token: row.token,
  };
}

interface ResolverArgs<TInput> {
  input: TInput;
}

interface UploadMediaArgs {
  file: unknown;
  category?: unknown;
}

function isUploadedFile(value: unknown): value is UploadedFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as UploadedFile).arrayBuffer === 'function' &&
    typeof (value as UploadedFile).name === 'string'
  );
}
