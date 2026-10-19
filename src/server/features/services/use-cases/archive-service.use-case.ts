import { AppError } from '@/server/common/errors/app-error';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  countActiveMembershipsForService,
  findServiceById,
  softDeleteService,
} from '@/server/features/services/repositories/services.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';

export async function archiveServiceUseCase(
  id: string,
  context: GqlContext,
  dependencies: ArchiveServiceDependencies = defaultDependencies
) {
  requireAdmin(context);

  const existingService = await dependencies.findServiceById(id);

  if (existingService === null) {
    throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
  }

  if (existingService.deletedAt !== null) {
    throw new AppError('Service is already archived', 409, 'SERVICE_ALREADY_ARCHIVED');
  }

  const activeMembershipCount = await dependencies.countActiveMembershipsForService(id);

  if (activeMembershipCount > 0) {
    throw new AppError(
      'Service still has active memberships',
      409,
      'SERVICE_HAS_ACTIVE_MEMBERSHIPS'
    );
  }

  const service = await dependencies.softDeleteService(id);

  if (service === null) {
    throw new AppError('Service could not be archived', 500, 'SERVICE_ARCHIVE_FAILED');
  }

  return service;
}

interface ArchiveServiceDependencies {
  countActiveMembershipsForService: (serviceId: string) => Promise<number>;
  findServiceById: (id: string) => Promise<ServiceModel | null>;
  softDeleteService: (id: string) => Promise<ServiceModel | null>;
}

const defaultDependencies: ArchiveServiceDependencies = {
  countActiveMembershipsForService,
  findServiceById,
  softDeleteService,
};
