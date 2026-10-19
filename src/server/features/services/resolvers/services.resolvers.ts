import { GraphQLScalarType, Kind } from 'graphql';
import type { ValueNode } from 'graphql';

import {
  createServiceInputSchema,
  updateServiceInputSchema,
} from '@/server/features/services/schemas/validators/services.validators';
import { archiveServiceUseCase } from '@/server/features/services/use-cases/archive-service.use-case';
import { createServiceUseCase } from '@/server/features/services/use-cases/create-service.use-case';
import {
  getPublicServicesUseCase,
  getServiceUseCase,
  getServicesUseCase,
} from '@/server/features/services/use-cases/get-services.use-case';
import { restoreServiceUseCase } from '@/server/features/services/use-cases/restore-service.use-case';
import { updateServiceUseCase } from '@/server/features/services/use-cases/update-service.use-case';
import { paginationValidators } from '@/server/features/common/schemas/validators/pagination.validators';
import { validateInput } from '@/server/features/common/middleware/validate-input';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type {
  ServiceDto,
  ServiceModel,
} from '@/server/features/services/schemas/model/services.model';

const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  parseLiteral: parseJsonLiteral,
  parseValue: (value) => value,
  serialize: (value) => value,
});

export const servicesResolvers = {
  JSON: jsonScalar,
  Mutation: {
    async createService(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(createServiceInputSchema, args.input);
      const service = await createServiceUseCase(input, context);

      return toServiceDto(service);
    },
    async archiveService(_parent: unknown, args: ServiceMutationArgs, context: GqlContext) {
      const service = await archiveServiceUseCase(args.id, context);

      return toServiceDto(service);
    },
    async updateService(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(updateServiceInputSchema, args.input);
      const service = await updateServiceUseCase(input, context);

      return toServiceDto(service);
    },
    async restoreService(_parent: unknown, args: ServiceMutationArgs, context: GqlContext) {
      const service = await restoreServiceUseCase(args.id, context);

      return toServiceDto(service);
    },
  },
  Query: {
    async publicServices() {
      return getPublicServicesUseCase();
    },
    async service(_parent: unknown, args: ServiceQueryArgs, context: GqlContext) {
      return getServiceUseCase(args.id, context);
    },
    async services(_parent: unknown, args: unknown, context: GqlContext) {
      const input = validateInput(paginationValidators, args);

      return getServicesUseCase(input, context);
    },
  },
};

function toServiceDto(service: ServiceModel): ServiceDto {
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

function parseJsonLiteral(node: ValueNode): unknown {
  switch (node.kind) {
    case Kind.BOOLEAN:
    case Kind.STRING: {
      return node.value;
    }
    case Kind.FLOAT:
    case Kind.INT: {
      return Number(node.value);
    }
    case Kind.LIST: {
      return node.values.map((value) => parseJsonLiteral(value));
    }
    case Kind.NULL: {
      return null;
    }
    case Kind.OBJECT: {
      return Object.fromEntries(
        node.fields.map((field) => [field.name.value, parseJsonLiteral(field.value)])
      );
    }
    default: {
      return null;
    }
  }
}

interface ResolverArgs<TInput> {
  input: TInput;
}

interface ServiceQueryArgs {
  id: string;
}

interface ServiceMutationArgs {
  id: string;
}
