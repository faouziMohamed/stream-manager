import { validateInput } from '@/server/features/common/middleware/validate-input';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import { paginationValidators } from '@/server/features/common/schemas/validators/pagination.validators';
import { archiveCustomerUseCase } from '@/server/features/customers/use-cases/archive-customer.use-case';
import {
  createCustomerInputSchema,
  updateCustomerInputSchema,
} from '@/server/features/customers/schemas/validators/customers.validators';
import { createCustomerUseCase } from '@/server/features/customers/use-cases/create-customer.use-case';
import {
  getCustomerUseCase,
  getCustomersUseCase,
} from '@/server/features/customers/use-cases/get-customers.use-case';
import { updateCustomerUseCase } from '@/server/features/customers/use-cases/update-customer.use-case';

export const customersResolvers = {
  Mutation: {
    async createCustomer(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(createCustomerInputSchema, args.input);
      const customer = await createCustomerUseCase(input, context);

      return toCustomerDto(customer);
    },
    async archiveCustomer(_parent: unknown, args: CustomerMutationArgs, context: GqlContext) {
      const customer = await archiveCustomerUseCase(args.id, context);

      return toCustomerDto(customer);
    },
    async updateCustomer(_parent: unknown, args: ResolverArgs<unknown>, context: GqlContext) {
      const input = validateInput(updateCustomerInputSchema, args.input);
      const customer = await updateCustomerUseCase(input, context);

      return toCustomerDto(customer);
    },
  },
  Query: {
    async customer(_parent: unknown, args: CustomerQueryArgs, context: GqlContext) {
      return getCustomerUseCase(args.id, context);
    },
    async customers(_parent: unknown, args: unknown, context: GqlContext) {
      const input = validateInput(paginationValidators, args);

      return getCustomersUseCase(input, context);
    },
  },
};

function toCustomerDto(customer: {
  businessId: string;
  createdAt: Date;
  email: string | null;
  id: string;
  isActive: boolean;
  language: string;
  name: string;
  notesContent: unknown | null;
  phone: string | null;
  updatedAt: Date;
}) {
  return {
    businessId: customer.businessId,
    createdAt: customer.createdAt.toISOString(),
    email: customer.email,
    id: customer.id,
    isActive: customer.isActive,
    language: customer.language,
    name: customer.name,
    notesContent: customer.notesContent,
    phone: customer.phone,
    updatedAt: customer.updatedAt.toISOString(),
  };
}

interface ResolverArgs<TInput> {
  input: TInput;
}

interface CustomerQueryArgs {
  id: string;
}

interface CustomerMutationArgs {
  id: string;
}
