import { settingsResolvers } from '@/server/features/settings/resolvers/settings.resolvers';
import { settingsTypeDefs } from '@/server/features/settings/schemas/graphql/settings.schema';
import {
  deleteMediaAssetInputSchema,
  listMediaAssetsInputSchema,
} from '@/server/features/settings/schemas/validators/settings.validators';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

const userContext: GqlContext = {
  isAccountant: false,
  isAdmin: false,
  sessionId: 'ses_user',
  user: {
    avatar: null,
    email: 'user@example.com',
    id: 'usr_user',
    name: 'User',
    role: 'user',
  },
};

describe('settings GraphQL surface', () => {
  it('exposes the persistent media library contract', () => {
    expect(settingsTypeDefs).toContain('type MediaAsset');
    expect(settingsTypeDefs).toContain(
      'mediaAssets(input: ListMediaAssetsInput): MediaAssetConnection!'
    );
    expect(settingsTypeDefs).toContain(
      'deleteMediaAsset(input: DeleteMediaAssetInput!): DeleteMediaAssetPayload!'
    );
    expect(settingsTypeDefs).toContain(
      'uploadMedia(file: Upload!, category: MediaCategory): MediaAsset!'
    );
  });

  it('validates media pagination and prefixed asset IDs', () => {
    expect(listMediaAssetsInputSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(deleteMediaAssetInputSchema.parse({ id: 'img_1' })).toEqual({ id: 'img_1' });
    expect(() => deleteMediaAssetInputSchema.parse({ id: 'svc_1' })).toThrow();
  });

  it('rejects media library reads for non-admin users', async () => {
    await expect(
      settingsResolvers.Query.mediaAssets(undefined, { input: {} }, userContext)
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });

  it('rejects media deletion for non-admin users', async () => {
    await expect(
      settingsResolvers.Mutation.deleteMediaAsset(
        undefined,
        { input: { id: 'img_1' } },
        userContext
      )
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });
});
