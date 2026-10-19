import { readFileSync } from 'node:fs';
import path from 'node:path';

const serverRoot = path.resolve(process.cwd(), 'src/server');

describe('media assets persistence contract', () => {
  it('defines durable media metadata and repository operations', async () => {
    const tableSource = readFileSync(
      path.join(serverRoot, 'lib/db/tables/settings.table.ts'),
      'utf8'
    );
    const repository =
      await import('@/server/features/settings/repositories/media-assets.repository');

    expect(tableSource).toContain("pgTable('media_assets'");
    expect(tableSource).toContain("originalFilename: varchar('original_filename'");
    expect(tableSource).toContain("storageKey: varchar('storage_key'");
    expect(tableSource).toContain("contentType: varchar('content_type'");
    expect(tableSource).toContain("sizeBytes: integer('size_bytes'");
    expect(tableSource).toContain("uploadedByUserId: varchar('uploaded_by_user_id'");
    expect(repository).toHaveProperty('insertMediaAsset');
    expect(repository).toHaveProperty('findMediaAssets');
    expect(repository).toHaveProperty('findMediaAssetById');
    expect(repository).toHaveProperty('deleteMediaAsset');
  });
});
