import { requireAdmin } from '@/lib/graphql/resolvers/guards';
import type { GraphQLContext } from '@/lib/graphql/context';
import {
  cleanupUnreferencedRichTextAssets,
  uploadRichTextAsset,
} from '@/modules/rich-text/server/services/rich-text-assets.service';

export const richTextAssetsResolvers = {
  Mutation: {
    cleanupRichTextAssets: async (
      _: unknown,
      { publicIds }: { publicIds: string[] },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);
      await cleanupUnreferencedRichTextAssets(publicIds);
      return true;
    },
    uploadRichTextAsset: async (
      _: unknown,
      { base64, filename }: { base64: string; filename?: string },
      ctx: GraphQLContext
    ) => {
      requireAdmin(ctx);
      return uploadRichTextAsset({ base64, filename }, ctx.user?.id);
    },
  },
};
