import { AppError } from '@/server/common/errors/app-error';
import { requireAdmin } from '@/server/features/common/guards/require-admin.guard';
import {
  countActiveMembershipsForCustomer,
  findCustomerById,
  updateCustomer,
} from '@/server/features/customers/repositories/customers.repository';
import type { GqlContext } from '@/server/features/common/schemas/model/context.model';

export async function archiveCustomerUseCase(
  id: string,
  context: GqlContext,
  dependencies: ArchiveCustomerDependencies = defaultDependencies
) {
  requireAdmin(context);

  const existingCustomer = await dependencies.findCustomerById(id);

  if (existingCustomer === null) {
    throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  if (existingCustomer.isActive === false) {
    throw new AppError('Customer is already archived', 409, 'CUSTOMER_ALREADY_ARCHIVED');
  }

  const activeMembershipCount = await dependencies.countActiveMembershipsForCustomer(id);

  if (activeMembershipCount > 0) {
    throw new AppError(
      'Customer still has active memberships',
      409,
      'CUSTOMER_HAS_ACTIVE_MEMBERSHIPS'
    );
  }

  const customer = await dependencies.updateCustomer(id, {
    isActive: false,
  });

  if (customer === null) {
    throw new AppError('Customer could not be archived', 500, 'CUSTOMER_ARCHIVE_FAILED');
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

interface ArchiveCustomerDependencies {
  countActiveMembershipsForCustomer: (customerId: string) => Promise<number>;
  findCustomerById: (id: string) => Promise<CustomerRecord | null>;
  updateCustomer: (
    id: string,
    input: {
      isActive: boolean;
    }
  ) => Promise<CustomerRecord | null>;
}

const defaultDependencies: ArchiveCustomerDependencies = {
  countActiveMembershipsForCustomer,
  findCustomerById,
  updateCustomer,
};
