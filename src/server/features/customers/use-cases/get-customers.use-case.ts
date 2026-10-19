import { AppError } from '@/server/common/errors/app-error';
import { paginationMeta } from '@/server/common/utils/pagination';
import { requireModerator } from '@/server/features/common/guards/require-moderator.guard';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { PaginatedResult } from '@/server/features/common/schemas/model/pagination.model';
import {
  findCustomerById,
  findCustomers,
} from '@/server/features/customers/repositories/customers.repository';

export async function getCustomersUseCase(
  input: GetCustomersInput,
  context: GqlContext,
  dependencies: GetCustomersDependencies = defaultDependencies
): Promise<PaginatedResult<CustomerDto>> {
  requireModerator(context);

  const result = await dependencies.findCustomers(input);

  return {
    items: result.items.map((customer) => toCustomerDto(customer)),
    pageInfo: paginationMeta(result.total, input.page, input.pageSize),
  };
}

export async function getCustomerUseCase(
  id: string,
  context: GqlContext,
  dependencies: GetCustomerDependencies = defaultGetCustomerDependencies
): Promise<CustomerDto> {
  requireModerator(context);

  const customer = await dependencies.findCustomerById(id);

  if (customer === null) {
    throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  return toCustomerDto(customer);
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

interface CustomerDto {
  businessId: string;
  createdAt: string;
  email: string | null;
  id: string;
  isActive: boolean;
  language: string;
  name: string;
  notesContent: unknown | null;
  phone: string | null;
  updatedAt: string;
}

interface GetCustomersInput {
  page: number;
  pageSize: number;
}

interface FindCustomersResult {
  items: CustomerRecord[];
  total: number;
}

interface GetCustomersDependencies {
  findCustomers: (input: GetCustomersInput) => Promise<FindCustomersResult>;
}

interface GetCustomerDependencies {
  findCustomerById: (id: string) => Promise<CustomerRecord | null>;
}

function toCustomerDto(customer: CustomerRecord): CustomerDto {
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

const defaultDependencies: GetCustomersDependencies = {
  findCustomers,
};

const defaultGetCustomerDependencies: GetCustomerDependencies = {
  findCustomerById,
};
