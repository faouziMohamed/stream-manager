import { GraphQLError } from 'graphql';

import { uploadMediaUseCase } from '@/server/features/settings/use-cases/upload-media.use-case';
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

function fileFrom(bytes: Buffer | Uint8Array, name: string) {
  const buffer = Buffer.from(bytes);
  return {
    name,
    arrayBuffer: async () =>
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  };
}

describe('uploadMediaUseCase', () => {
  it('uploads media, persists metadata, and returns the complete asset', async () => {
    const uploaded: { contentType: string; key: string }[] = [];
    const inserted: Record<string, unknown>[] = [];
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const result = await uploadMediaUseCase(
      { category: 'SERVICES', file: fileFrom(Buffer.from([0xFF, 0xD8, 0xFF, 0xDB]), 'avatar.jpg') },
      adminContext,
      {
        createId: () => 'img_1',
        deleteObject: async () => {
          return;
        },
        insertMediaAsset: async (input) => {
          inserted.push(input);
          return { ...input, createdAt };
        },
        now: () => createdAt,
        resolveImageUrl: async (key) => `https://cdn.example.com/${key}`,
        sniffMimeType: () => 'image/jpeg',
        uploadObject: async (input) => {
          uploaded.push({ contentType: input.contentType, key: input.key });
        },
      }
    );

    expect(uploaded).toEqual([
      { contentType: 'image/jpeg', key: 'media/services/2026/01/img_1.jpeg' },
    ]);
    expect(inserted).toEqual([
      {
        contentType: 'image/jpeg',
        id: 'img_1',
        originalFilename: 'avatar.jpg',
        sizeBytes: 4,
        storageKey: 'media/services/2026/01/img_1.jpeg',
        uploadedByUserId: 'usr_1',
      },
    ]);
    expect(result).toEqual({
      contentType: 'image/jpeg',
      createdAt: '2026-01-01T00:00:00.000Z',
      id: 'img_1',
      imageUrl: 'https://cdn.example.com/media/services/2026/01/img_1.jpeg',
      originalFilename: 'avatar.jpg',
      sizeBytes: 4,
      storageKey: 'media/services/2026/01/img_1.jpeg',
      uploadedByUserId: 'usr_1',
    });
  });

  it('rejects unsupported mime types', async () => {
    await expect(
      uploadMediaUseCase(
        { category: 'LIBRARY', file: fileFrom(Buffer.from('test'), 'a.txt') },
        adminContext,
        {
          createId: () => 'img_1',
          deleteObject: async () => {
            return;
          },
          insertMediaAsset: async () => null,
          now: () => new Date(),
          resolveImageUrl: async () => 'unused',
          sniffMimeType: () => null,
          uploadObject: async () => {
            return;
          },
        }
      )
    ).rejects.toMatchObject({ code: 'MEDIA_MIME_UNSUPPORTED' });
  });

  it('rejects images larger than the maximum size', async () => {
    const uploaded: string[] = [];

    await expect(
      uploadMediaUseCase(
        { category: 'LIBRARY', file: fileFrom(Buffer.alloc(8 * 1024 * 1024 + 1), 'big.gif') },
        adminContext,
        {
          createId: () => 'img_1',
          deleteObject: async () => {
            return;
          },
          insertMediaAsset: async () => null,
          now: () => new Date('2026-01-01T00:00:00.000Z'),
          resolveImageUrl: async () => 'unused',
          sniffMimeType: () => 'image/gif',
          uploadObject: async (input) => {
            uploaded.push(input.key);
          },
        }
      )
    ).rejects.toMatchObject({ code: 'MEDIA_TOO_LARGE', statusCode: 400 });

    expect(uploaded).toEqual([]);
  });

  it('fails when uploaded media metadata cannot be persisted', async () => {
    const deletedKeys: string[] = [];

    await expect(
      uploadMediaUseCase(
        {
          category: 'LIBRARY',
          file: fileFrom(Buffer.from([0xFF, 0xD8, 0xFF, 0xDB]), 'avatar.jpg'),
        },
        adminContext,
        {
          createId: () => 'img_1',
          deleteObject: async (key) => {
            deletedKeys.push(key);
          },
          insertMediaAsset: async () => null,
          now: () => new Date('2026-01-01T00:00:00.000Z'),
          resolveImageUrl: async () => 'unused',
          sniffMimeType: () => 'image/jpeg',
          uploadObject: async () => {
            return;
          },
        }
      )
    ).rejects.toMatchObject({ code: 'MEDIA_METADATA_CREATE_FAILED' });

    expect(deletedKeys).toEqual(['media/library/2026/01/img_1.jpeg']);
  });

  it('requires admin user', async () => {
    const nonAdminContext: GqlContext = {
      ...adminContext,
      isAdmin: false,
      user: { ...adminContext.user!, role: 'accountant' },
    };

    await expect(
      uploadMediaUseCase(
        { category: 'LIBRARY', file: fileFrom(Buffer.from('test'), 'a.png') },
        nonAdminContext
      )
    ).rejects.toBeInstanceOf(GraphQLError);
  });
});
