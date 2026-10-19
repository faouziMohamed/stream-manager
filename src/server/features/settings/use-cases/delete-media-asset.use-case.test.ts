import { deleteMediaAssetUseCase } from '@/server/features/settings/use-cases/delete-media-asset.use-case';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

const adminContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: 'sess_1',
  user: {
    avatar: null,
    email: 'admin@example.com',
    id: 'usr_1',
    name: 'Admin',
    role: 'admin',
  },
};

const asset = {
  contentType: 'image/jpeg',
  createdAt: new Date('2026-06-04T08:00:00.000Z'),
  id: 'img_1',
  originalFilename: 'cover.jpg',
  sizeBytes: 2048,
  storageKey: 'media/2026/img_1.jpeg',
  uploadedByUserId: 'usr_1',
};

describe('deleteMediaAssetUseCase', () => {
  it('deletes the storage object before deleting metadata', async () => {
    const operations: string[] = [];

    const result = await deleteMediaAssetUseCase('img_1', adminContext, {
      deleteMediaAsset: async () => {
        operations.push('metadata');
        return asset;
      },
      deleteObject: async () => {
        operations.push('storage');
      },
      findMediaAssetById: async () => asset,
    });

    expect(operations).toEqual(['storage', 'metadata']);
    expect(result).toEqual(asset);
  });

  it('rejects missing assets without deleting storage or metadata', async () => {
    let deleteCalls = 0;

    await expect(
      deleteMediaAssetUseCase('img_missing', adminContext, {
        deleteMediaAsset: async () => {
          deleteCalls += 1;
          return null;
        },
        deleteObject: async () => {
          deleteCalls += 1;
        },
        findMediaAssetById: async () => null,
      })
    ).rejects.toMatchObject({ code: 'MEDIA_ASSET_NOT_FOUND', statusCode: 404 });

    expect(deleteCalls).toBe(0);
  });

  it('fails when metadata cannot be deleted after storage deletion', async () => {
    await expect(
      deleteMediaAssetUseCase('img_1', adminContext, {
        deleteMediaAsset: async () => null,
        deleteObject: async () => {
          return;
        },
        findMediaAssetById: async () => asset,
      })
    ).rejects.toMatchObject({ code: 'MEDIA_METADATA_DELETE_FAILED', statusCode: 500 });
  });

  it('rejects non-admin users before loading the asset', async () => {
    let repositoryCalls = 0;

    await expect(
      deleteMediaAssetUseCase(
        'img_1',
        { ...adminContext, isAdmin: false, user: { ...adminContext.user!, role: 'user' } },
        {
          deleteMediaAsset: async () => asset,
          deleteObject: async () => {
            return;
          },
          findMediaAssetById: async () => {
            repositoryCalls += 1;
            return asset;
          },
        }
      )
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });

    expect(repositoryCalls).toBe(0);
  });
});
