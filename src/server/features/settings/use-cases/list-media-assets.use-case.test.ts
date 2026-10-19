import { listMediaAssetsUseCase } from '@/server/features/settings/use-cases/list-media-assets.use-case';
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

describe('listMediaAssetsUseCase', () => {
  it('returns paginated media assets with resolved public URLs', async () => {
    const result = await listMediaAssetsUseCase({ page: 2, pageSize: 1 }, adminContext, {
      findMediaAssets: async () => ({ items: [asset], total: 3 }),
      resolveImageUrl: async (key) => `https://cdn.example.com/${key}`,
    });

    expect(result).toEqual({
      items: [
        {
          ...asset,
          createdAt: '2026-06-04T08:00:00.000Z',
          imageUrl: 'https://cdn.example.com/media/2026/img_1.jpeg',
        },
      ],
      pageInfo: { page: 2, pageSize: 1, total: 3, totalPages: 3 },
    });
  });

  it('rejects non-admin users before loading media', async () => {
    let repositoryCalls = 0;

    await expect(
      listMediaAssetsUseCase(
        { page: 1, pageSize: 20 },
        { ...adminContext, isAdmin: false, user: { ...adminContext.user!, role: 'user' } },
        {
          findMediaAssets: async () => {
            repositoryCalls += 1;
            return { items: [], total: 0 };
          },
          resolveImageUrl: async () => 'unused',
        }
      )
    ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });

    expect(repositoryCalls).toBe(0);
  });
});
