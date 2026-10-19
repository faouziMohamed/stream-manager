import { AppError } from '@/server/common/errors/app-error';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  findCustomerById,
  updateCustomer,
} from '@/server/features/customers/repositories/customers.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { UpdateCustomerInput } from '@/server/features/customers/schemas/validators/customers.validators';

export async function updateCustomerUseCase(
  input: UpdateCustomerInput,
  context: GqlContext,
  dependencies: UpdateCustomerDependencies = defaultDependencies
) {
  requireAdmin(context);

  const existingCustomer = await dependencies.findCustomerById(input.id);

  if (existingCustomer === null) {
    throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  const customer = await dependencies.updateCustomer(input.id, {
    email: input.email,
    ...(input.isActive != null && { isActive: input.isActive }),
    ...(input.language != null && { language: input.language }),
    name: input.name,
    notesContent: input.notesContent,
    phone: input.phone,
  });

  if (customer === null) {
    throw new AppError('Customer could not be updated', 500, 'CUSTOMER_UPDATE_FAILED');
  }

  return customer;
}

interface CustomerRecord {
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
}

type UpdateCustomerRepositoryInput = Partial<
  Pick<CustomerRecord, 'email' | 'isActive' | 'language' | 'name' | 'notesContent' | 'phone'>
>;

interface UpdateCustomerDependencies {
  findCustomerById: (id: string) => Promise<CustomerRecord | null>;
  updateCustomer: (
    id: string,
    input: UpdateCustomerRepositoryInput
  ) => Promise<CustomerRecord | null>;
}

const defaultDependencies: UpdateCustomerDependencies = {
  findCustomerById,
  updateCustomer,
};
