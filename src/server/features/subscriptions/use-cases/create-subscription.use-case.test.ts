import {
  adminContext,
  createDependencies,
  userContext,
  validInput,
} from '@/server/features/subscriptions/use-cases/create-subscription.fixtures.test-support';
import { createSubscriptionUseCase } from '@/server/features/subscriptions/use-cases/create-subscription.use-case';

describe('createSubscriptionUseCase', () => {
  it('rejects non-admin users before touching any repository', async () => {
    let planLookups = 0;
    const { dependencies } = createDependencies({
      findPlanById: async () => {
        planLookups += 1;
        return null;
      },
    });

    await expect(
      createSubscriptionUseCase(validInput, userContext, dependencies)
    ).rejects.toThrow();
    expect(planLookups).toBe(0);
  });

  it('derives the end date from the plan duration', async () => {
    const { captured, dependencies } = createDependencies();

    await createSubscriptionUseCase(validInput, adminContext, dependencies);

    // planRecord.durationMonths is 1, start 2026-05-10.
    expect(captured.insert?.membership.endDate).toBe('2026-06-09');
    expect(captured.insert?.membership.startDate).toBe('2026-05-10');
  });

  it('prices the payment from the plan and leaves it unpaid by default', async () => {
    const { captured, dependencies } = createDependencies();

    await createSubscriptionUseCase(validInput, adminContext, dependencies);

    expect(captured.insert?.payment.amount).toBe('99.99');
    expect(captured.insert?.payment.currencyCode).toBe('MAD');
    expect(captured.insert?.payment.status).toBe('unpaid');
    expect(captured.insert?.payment.paidDate).toBeNull();
  });

  it('settles the payment immediately when markPaid is set', async () => {
    const { captured, dependencies } = createDependencies();

    const result = await createSubscriptionUseCase(
      { ...validInput, markPaid: true },
      adminContext,
      dependencies
    );

    expect(captured.insert?.payment.status).toBe('paid');
    expect(captured.insert?.payment.paidDate).toBe('2026-05-10');
    expect(result.payment.status).toBe('paid');
  });

  it('creates the customer inline when one is described instead of picked', async () => {
    let existingLookups = 0;
    const { captured, dependencies } = createDependencies({
      findCustomerById: async () => {
        existingLookups += 1;
        return null;
      },
    });

    await createSubscriptionUseCase(
      {
        ...validInput,
        customerId: '',
        newCustomer: { email: 'new@example.com', name: 'New Client', phone: '+212600000000' },
      },
      adminContext,
      dependencies
    );

    expect(existingLookups).toBe(0);
    expect(captured.insert?.newCustomer).toMatchObject({
      email: 'new@example.com',
      id: 'cst_new',
      isActive: true,
      name: 'New Client',
    });
  });

  it('passes the chosen profile through so it is claimed in the same transaction', async () => {
    const { captured, dependencies } = createDependencies();

    const result = await createSubscriptionUseCase(
      { ...validInput, profile: { accountId: 'acc_test', profileId: 'prf_test' } },
      adminContext,
      dependencies
    );

    expect(captured.insert?.profile).toEqual({
      accountId: 'acc_test',
      assignmentId: 'asg_test',
      profileId: 'prf_test',
    });
    expect(result.assignment?.profileId).toBe('prf_test');
  });

  it('refuses an inactive plan', async () => {
    const { dependencies } = createDependencies({
      findPlanById: async () => ({
        currencyCode: 'MAD',
        durationMonths: 1,
        id: 'pln_test',
        isActive: false,
        name: 'Retired',
        price: '10.00',
        serviceId: 'svc_test',
      }),
    });

    await expect(
      createSubscriptionUseCase(validInput, adminContext, dependencies)
    ).rejects.toMatchObject({ code: 'SUBSCRIPTION_PLAN_INACTIVE' });
  });

  it('refuses an archived customer', async () => {
    const { dependencies } = createDependencies({
      findCustomerById: async () => ({
        businessId: 'CST-0001',
        email: null,
        id: 'cst_test',
        isActive: false,
        name: 'Archived',
        phone: null,
      }),
    });

    await expect(
      createSubscriptionUseCase(validInput, adminContext, dependencies)
    ).rejects.toMatchObject({ code: 'SUBSCRIPTION_CUSTOMER_ARCHIVED' });
  });

  it('fails loudly when the transaction returns nothing', async () => {
    const { dependencies } = createDependencies({ insertSubscription: async () => null });

    await expect(
      createSubscriptionUseCase(validInput, adminContext, dependencies)
    ).rejects.toMatchObject({ code: 'SUBSCRIPTION_CREATE_FAILED' });
  });

  it('still returns the subscription when the notification email fails', async () => {
    const { dependencies } = createDependencies({
      sendSubscriptionNotification: async () => {
        throw new Error('smtp-down');
      },
    });

    const result = await createSubscriptionUseCase(validInput, adminContext, dependencies);

    expect(result.membership.id).toBe('mbr_test');
  });
});
