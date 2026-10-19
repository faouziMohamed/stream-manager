import { AppError } from '@/server/common/errors/app-error';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  findServiceById,
  findServiceByName,
  updateService,
} from '@/server/features/services/repositories/services.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';
import type { UpdateServiceInput } from '@/server/features/services/schemas/validators/services.validators';

export async function updateServiceUseCase(
  input: UpdateServiceInput,
  context: GqlContext,
  dependencies: UpdateServiceDependencies = defaultDependencies
) {
  requireAdmin(context);

  const existingService = await dependencies.findServiceById(input.id);

  if (existingService === null) {
    throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
  }

  if (input.name !== undefined) {
    const duplicateService = await dependencies.findServiceByName(input.name);

    if (duplicateService !== null && duplicateService.id !== input.id) {
      throw new AppError('Service name already exists', 409, 'SERVICE_NAME_EXISTS');
    }
  }

  const service = await dependencies.updateService(input.id, {
    category: input.category,
    descriptionContent: input.descriptionContent,
    imageKey: input.imageKey,
    ...(input.isActive != null && { isActive: input.isActive }),
    name: input.name,
    supportsProfiles: input.supportsProfiles,
  });

  if (service === null) {
    throw new AppError('Service could not be updated', 500, 'SERVICE_UPDATE_FAILED');
  }

  return service;
}

type UpdateServiceRepositoryInput = Partial<
  Pick<
    ServiceModel,
    'category' | 'descriptionContent' | 'imageKey' | 'isActive' | 'name' | 'supportsProfiles'
  >
>;

interface UpdateServiceDependencies {
  findServiceById: (id: string) => Promise<ServiceModel | null>;
  findServiceByName: (name: string) => Promise<ServiceModel | null>;
  updateService: (id: string, input: UpdateServiceRepositoryInput) => Promise<ServiceModel | null>;
}

const defaultDependencies: UpdateServiceDependencies = {
  findServiceById,
  findServiceByName,
  updateService,
};
