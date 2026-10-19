import { AppError } from '@/server/common/errors/app-error';
import { createResourceId } from '@/server/common/utils/resource-id';
import {
  findServiceByName,
  insertService,
} from '@/server/features/services/repositories/services.repository';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { ServiceModel } from '@/server/features/services/schemas/model/services.model';
import type { CreateServiceInput } from '@/server/features/services/schemas/validators/services.validators';

export async function createServiceUseCase(
  input: CreateServiceInput,
  context: GqlContext,
  dependencies: CreateServiceDependencies = defaultDependencies
) {
  requireAdmin(context);

  const existingService = await dependencies.findServiceByName(input.name);

  if (existingService !== null) {
    throw new AppError('Service name already exists', 409, 'SERVICE_NAME_EXISTS');
  }

  const service = await dependencies.insertService({
    category: input.category,
    descriptionContent: input.descriptionContent ?? null,
    id: dependencies.createId(),
    imageKey: input.imageKey ?? null,
    isActive: true,
    name: input.name,
    supportsProfiles: input.supportsProfiles,
  });

  if (service === null) {
    throw new AppError('Service could not be created', 500, 'SERVICE_CREATE_FAILED');
  }

  return service;
}

interface InsertServiceInput {
  category: CreateServiceInput['category'];
  descriptionContent?: unknown | null;
  id: string;
  imageKey?: string | null;
  isActive?: boolean;
  name: string;
  supportsProfiles: boolean;
}

interface CreateServiceDependencies {
  createId: () => string;
  findServiceByName: (name: string) => Promise<ServiceModel | null>;
  insertService: (input: InsertServiceInput) => Promise<ServiceModel | null>;
}

const defaultDependencies: CreateServiceDependencies = {
  createId: () => createResourceId('svc'),
  findServiceByName,
  insertService,
};
