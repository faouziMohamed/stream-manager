import { AppError } from '@/server/common/errors/app-error';
import { paginationMeta } from '@/server/common/utils/pagination';
import { requireAuth } from '@/server/features/common/guards/require-auth.guard';
import { resolveImageUrl } from '@/server/features/storage/storage.service';
import {
  findActiveServices,
  findServiceById,
  findServices,
} from '@/server/features/services/repositories/services.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { PaginatedResult } from '@/server/features/common/schemas/model/pagination.model';
import type {
  ServiceDto,
  ServiceModel,
} from '@/server/features/services/schemas/model/services.model';

export async function getServicesUseCase(
  input: GetServicesInput,
  context: GqlContext,
  dependencies: GetServicesDependencies = defaultDependencies
): Promise<PaginatedResult<ServiceDto>> {
  requireAuth(context);

  const result = await dependencies.findServices(input);
  const items = await Promise.all(
    result.items.map(async (service) => toServiceDto(service, dependencies.resolveImageUrl))
  );

  return {
    items,
    pageInfo: paginationMeta(result.total, input.page, input.pageSize),
  };
}

export async function getServiceUseCase(
  id: string,
  context: GqlContext,
  dependencies: GetServiceDependencies = defaultGetServiceDependencies
): Promise<ServiceDto> {
  requireAuth(context);

  const service = await dependencies.findServiceById(id);

  if (service === null) {
    throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
  }

  return toServiceDto(service, dependencies.resolveImageUrl);
}

interface GetServicesInput {
  page: number;
  pageSize: number;
}

interface FindServicesResult {
  items: ServiceModel[];
  total: number;
}

interface GetServicesDependencies {
  findServices: (input: GetServicesInput) => Promise<FindServicesResult>;
  resolveImageUrl: (key: string) => Promise<string>;
}

interface GetServiceDependencies {
  findServiceById: (id: string) => Promise<ServiceModel | null>;
  resolveImageUrl: (key: string) => Promise<string>;
}

async function toServiceDto(
  service: ServiceModel,
  resolveImageUrlFn: (key: string) => Promise<string>
): Promise<ServiceDto> {
  const imageUrl =
    service.imageKey === null || service.imageKey.length === 0
      ? null
      : await resolveImageUrlFn(service.imageKey);

  return {
    category: service.category,
    createdAt: service.createdAt.toISOString(),
    descriptionContent: service.descriptionContent,
    id: service.id,
    imageKey: service.imageKey,
    imageUrl,
    isActive: service.isActive,
    name: service.name,
    supportsProfiles: service.supportsProfiles,
    updatedAt: service.updatedAt.toISOString(),
  };
}

const defaultDependencies: GetServicesDependencies = {
  findServices,
  resolveImageUrl,
};

const defaultGetServiceDependencies: GetServiceDependencies = {
  findServiceById,
  resolveImageUrl,
};

export async function getPublicServicesUseCase(
  dependencies: GetPublicServicesDependencies = defaultPublicDependencies
): Promise<ServiceDto[]> {
  const services = await dependencies.findActiveServices();

  return services.map((service) => toPublicServiceDto(service));
}

function toPublicServiceDto(service: ServiceModel): ServiceDto {
  return {
    category: service.category,
    createdAt: service.createdAt.toISOString(),
    descriptionContent: service.descriptionContent,
    id: service.id,
    imageKey: service.imageKey,
    imageUrl: null,
    isActive: service.isActive,
    name: service.name,
    supportsProfiles: service.supportsProfiles,
    updatedAt: service.updatedAt.toISOString(),
  };
}

interface GetPublicServicesDependencies {
  findActiveServices: () => Promise<ServiceModel[]>;
}

const defaultPublicDependencies: GetPublicServicesDependencies = {
  findActiveServices,
};
