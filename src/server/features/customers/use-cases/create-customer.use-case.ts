import { AppError } from '@/server/common/errors/app-error';
import { nextCustomerBusinessId } from '@/server/common/utils/business-id';
import { createResourceId } from '@/server/common/utils/resource-id';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  findLatestCustomerBusinessId,
  insertCustomer,
} from '@/server/features/customers/repositories/customers.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

export async function createCustomerUseCase(
  input: CreateCustomerInput,
  context: GqlContext,
  dependencies: CreateCustomerDependencies = defaultDependencies
) {
  requireAdmin(context);

  const id = dependencies.createId();
  let latestBusinessId = await dependencies.findLatestCustomerBusinessId();

  for (let attempt = 1; attempt <= maxBusinessIdRetryAttempts; attempt += 1) {
    const businessId = nextCustomerBusinessId(latestBusinessId);

    try {
      const customer = await dependencies.insertCustomer({
        businessId,
        email: input.email ?? null,
        id,
        isActive: true,
        language: input.language ?? 'fr',
        name: input.name,
        notesContent: input.notesContent ?? null,
        phone: input.phone ?? null,
      });

      if (customer === null) {
        throw new AppError('Customer could not be created', 500, 'CUSTOMER_CREATE_FAILED');
      }

      return customer;
    } catch (error) {
      if (isUniqueViolation(error) && attempt < maxBusinessIdRetryAttempts) {
        latestBusinessId = businessId;
        continue;
      }

      throw error;
    }
  }

  throw new AppError('Customer could not be created', 500, 'CUSTOMER_CREATE_FAILED');
}

interface CreateCustomerInput {
  email?: string | null;
  language?: string | null;
  name: string;
  notesContent?: unknown | null;
  phone?: string | null;
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

interface InsertCustomerInput {
  businessId: string;
  email?: string | null;
  id: string;
  isActive: boolean;
  language: string;
  name: string;
  notesContent?: unknown | null;
  phone?: string | null;
}

interface CreateCustomerDependencies {
  createId: () => string;
  findLatestCustomerBusinessId: () => Promise<string | null>;
  insertCustomer: (input: InsertCustomerInput) => Promise<CustomerRecord | null>;
}

const defaultDependencies: CreateCustomerDependencies = {
  createId: () => createResourceId('cst'),
  findLatestCustomerBusinessId,
  insertCustomer,
};

const maxBusinessIdRetryAttempts = 3;

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return error.code === '23505';
}
