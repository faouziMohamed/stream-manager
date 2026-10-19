import { AppError } from '@/server/common/errors/app-error';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  findServiceById,
  restoreService,
} from '@/server/features/services/repositories/services.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';

export async function restoreServiceUseCase(
  id: string,
  context: GqlContext,
  dependencies: RestoreServiceDependencies = defaultDependencies
) {
  requireAdmin(context);

  const existingService = await dependencies.findServiceById(id);

  if (existingService === null) {
    throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
  }

  if (existingService.deletedAt === null) {
    throw new AppError('Service is not archived', 409, 'SERVICE_NOT_ARCHIVED');
  }

  const service = await dependencies.restoreService(id);

  if (service === null) {
    throw new AppError('Service could not be restored', 500, 'SERVICE_RESTORE_FAILED');
  }

  return service;
}

interface RestoreServiceDependencies {
  findServiceById: (id: string) => Promise<ServiceModel | null>;
  restoreService: (id: string) => Promise<ServiceModel | null>;
}

const defaultDependencies: RestoreServiceDependencies = {
  findServiceById,
  restoreService,
};
