import {
  adminContext,
  customerRecord,
  membershipRecord,
  paymentRecord,
  planRecord,
  serviceRecord,
  userContext,
} from '@/server/features/memberships/use-cases/create-membership.fixtures.test-support';
import { createMembershipUseCase } from '@/server/features/memberships/use-cases/create-membership.use-case';

describe('createMembershipUseCase', () => {
  it('rejects non-admin users before reaching repositories', async () => {
    let findPlanByIdCalls = 0;

    await expect(
      createMembershipUseCase(
        {
          customerId: 'cst_test',
          isRecurring: false,
          planId: 'pln_test',
          startDate: '2026-05-10',
        },
        userContext,
        {
          createMembershipId: () => 'mbr_test',
          createPaymentId: () => 'pay_test',
          findServiceById: async () => serviceRecord,
          findCustomerById: async () => customerRecord,
          findLatestMembershipBusinessId: async () => null,
          findLatestPaymentBusinessId: async () => null,
          findPlanById: async () => {
            findPlanByIdCalls += 1;
            return planRecord;
          },
          insertMembershipWithPayment: async () => membershipRecord,
        }
      )
    ).rejects.toMatchObject({
      extensions: {
        code: 'FORBIDDEN',
      },
      message: 'Forbidden',
    });

    expect(findPlanByIdCalls).toBe(0);
  });

  it('rejects missing customers before creating records', async () => {
    let insertCalls = 0;

    await expect(
      createMembershipUseCase(
        {
          customerId: 'cst_missing',
          isRecurring: false,
          planId: 'pln_test',
          startDate: '2026-05-10',
        },
        adminContext,
        {
          createMembershipId: () => 'mbr_test',
          createPaymentId: () => 'pay_test',
          findServiceById: async () => serviceRecord,
          findCustomerById: async () => null,
          findLatestMembershipBusinessId: async () => null,
          findLatestPaymentBusinessId: async () => null,
          findPlanById: async () => planRecord,
          insertMembershipWithPayment: async () => {
            insertCalls += 1;
            return membershipRecord;
          },
        }
      )
    ).rejects.toMatchObject({
      code: 'MEMBERSHIP_CUSTOMER_NOT_FOUND',
      statusCode: 404,
    });

    expect(insertCalls).toBe(0);
  });

  it('rejects inactive plans before creating records', async () => {
    let insertCalls = 0;

    await expect(
      createMembershipUseCase(
        {
          customerId: 'cst_test',
          isRecurring: false,
          planId: 'pln_inactive',
          startDate: '2026-05-10',
        },
        adminContext,
        {
          createMembershipId: () => 'mbr_test',
          createPaymentId: () => 'pay_test',
          findServiceById: async () => serviceRecord,
          findCustomerById: async () => customerRecord,
          findLatestMembershipBusinessId: async () => null,
          findLatestPaymentBusinessId: async () => null,
          findPlanById: async () => ({
            ...planRecord,
            isActive: false,
          }),
          insertMembershipWithPayment: async () => {
            insertCalls += 1;
            return membershipRecord;
          },
        }
      )
    ).rejects.toMatchObject({
      code: 'MEMBERSHIP_PLAN_INACTIVE',
      statusCode: 409,
    });

    expect(insertCalls).toBe(0);
  });

  it('creates membership and unpaid payment in one repository call', async () => {
    const membership = await createMembershipUseCase(
      {
        customerId: 'cst_test',
        isRecurring: true,
        planId: 'pln_test',
        startDate: '2026-05-10',
      },
      adminContext,
      {
        createMembershipId: () => 'mbr_test',
        createPaymentId: () => 'pay_test',
        findServiceById: async () => serviceRecord,
        findCustomerById: async () => customerRecord,
        findLatestMembershipBusinessId: async () => 'MBR-2026-0007',
        findLatestPaymentBusinessId: async () => 'PAY-2026-0002',
        findPlanById: async () => planRecord,
        insertMembershipWithPayment: async (input) => ({
          ...membershipRecord,
          businessId: input.membership.businessId,
          customerId: input.membership.customerId,
          endDate: input.membership.endDate,
          id: input.membership.id,
          isRecurring: input.membership.isRecurring,
          payment: {
            ...paymentRecord,
            amount: input.payment.amount,
            businessId: input.payment.businessId,
            currencyCode: input.payment.currencyCode,
            dueDate: input.payment.dueDate,
            id: input.payment.id,
            status: input.payment.status,
          },
          planId: input.membership.planId,
          startDate: input.membership.startDate,
        }),
      }
    );

    expect(membership.businessId).toBe('MBR-2026-0008');
    expect(membership.endDate).toBe('2026-06-09');
    expect(membership.payment.businessId).toBe('PAY-2026-0003');
    expect(membership.payment.amount).toBe('99.99');
    expect(membership.payment.status).toBe('unpaid');
  });

  it('rejects memberships whose plan service is archived', async () => {
    let insertCalls = 0;

    await expect(
      createMembershipUseCase(
        {
          customerId: 'cst_test',
          isRecurring: false,
          planId: 'pln_test',
          startDate: '2026-05-10',
        },
        adminContext,
        {
          createMembershipId: () => 'mbr_test',
          createPaymentId: () => 'pay_test',
          findCustomerById: async () => customerRecord,
          findLatestMembershipBusinessId: async () => null,
          findLatestPaymentBusinessId: async () => null,
          findPlanById: async () => planRecord,
          findServiceById: async () => ({ ...serviceRecord, isActive: false }),
          insertMembershipWithPayment: async () => {
            insertCalls += 1;
            return membershipRecord;
          },
        }
      )
    ).rejects.toMatchObject({
      code: 'MEMBERSHIP_SERVICE_INACTIVE',
      statusCode: 409,
    });

    expect(insertCalls).toBe(0);
  });

  it('retries with next membership/payment business ids on unique violation', async () => {
    let attempts = 0;
    const attemptedBusinessIds: Array<{
      membershipBusinessId: string;
      paymentBusinessId: string;
    }> = [];

    const membership = await createMembershipUseCase(
      {
        customerId: 'cst_test',
        isRecurring: true,
        planId: 'pln_test',
        startDate: '2026-05-10',
      },
      adminContext,
      {
        createMembershipId: () => 'mbr_test',
        createPaymentId: () => 'pay_test',
        findServiceById: async () => serviceRecord,
        findCustomerById: async () => customerRecord,
        findLatestMembershipBusinessId: async () => 'MBR-2026-0007',
        findLatestPaymentBusinessId: async () => 'PAY-2026-0002',
        findPlanById: async () => planRecord,
        insertMembershipWithPayment: async (input) => {
          attempts += 1;
          attemptedBusinessIds.push({
            membershipBusinessId: input.membership.businessId,
            paymentBusinessId: input.payment.businessId,
          });

          if (attempts === 1) {
            throw { code: '23505' };
          }

          return {
            ...membershipRecord,
            businessId: input.membership.businessId,
            customerId: input.membership.customerId,
            endDate: input.membership.endDate,
            id: input.membership.id,
            isRecurring: input.membership.isRecurring,
            payment: {
              ...paymentRecord,
              businessId: input.payment.businessId,
              id: input.payment.id,
            },
            planId: input.membership.planId,
            startDate: input.membership.startDate,
          };
        },
      }
    );

    expect(attempts).toBe(2);
    expect(attemptedBusinessIds).toEqual([
      {
        membershipBusinessId: 'MBR-2026-0008',
        paymentBusinessId: 'PAY-2026-0003',
      },
      {
        membershipBusinessId: 'MBR-2026-0009',
        paymentBusinessId: 'PAY-2026-0004',
      },
    ]);
    expect(membership.businessId).toBe('MBR-2026-0009');
    expect(membership.payment.businessId).toBe('PAY-2026-0004');
  });

  it('fails with MEMBERSHIP_CREATE_FAILED after exhausting unique-violation retries', async () => {
    let attempts = 0;

    await expect(
      createMembershipUseCase(
        { customerId: 'cst_test', isRecurring: false, planId: 'pln_test', startDate: '2026-05-10' },
        adminContext,
        {
          createMembershipId: () => 'mbr_test',
          createPaymentId: () => 'pay_test',
          findServiceById: async () => serviceRecord,
          findCustomerById: async () => customerRecord,
          findLatestMembershipBusinessId: async () => null,
          findLatestPaymentBusinessId: async () => null,
          findPlanById: async () => planRecord,
          insertMembershipWithPayment: async () => {
            attempts += 1;
            throw { code: '23505' };
          },
        }
      )
    ).rejects.toMatchObject({ code: 'MEMBERSHIP_CREATE_FAILED' });

    expect(attempts).toBe(3);
  });

  it('still creates the membership when the notification send fails (fire-and-forget)', async () => {
    const events: string[] = [];

    const membership = await createMembershipUseCase(
      { customerId: 'cst_test', isRecurring: false, planId: 'pln_test', startDate: '2026-05-10' },
      adminContext,
      {
        createMembershipId: () => 'mbr_test',
        createPaymentId: () => 'pay_test',
        findServiceById: async () => serviceRecord,
        findCustomerById: async () => customerRecord,
        findLatestMembershipBusinessId: async () => null,
        findLatestPaymentBusinessId: async () => null,
        findPlanById: async () => planRecord,
        insertMembershipWithPayment: async () => membershipRecord,
        sendMembershipNotification: async (input) => {
          events.push(input.event);
          throw new Error('smtp-down');
        },
      }
    );

    expect(membership).not.toBeNull();
    expect(events).toEqual(['MEMBERSHIP_CREATED']);
  });

  it('skips the notification when the customer has no email', async () => {
    const events: string[] = [];

    await createMembershipUseCase(
      { customerId: 'cst_test', isRecurring: false, planId: 'pln_test', startDate: '2026-05-10' },
      adminContext,
      {
        createMembershipId: () => 'mbr_test',
        createPaymentId: () => 'pay_test',
        findServiceById: async () => serviceRecord,
        findCustomerById: async () => ({ ...customerRecord, email: null }),
        findLatestMembershipBusinessId: async () => null,
        findLatestPaymentBusinessId: async () => null,
        findPlanById: async () => planRecord,
        insertMembershipWithPayment: async () => membershipRecord,
        sendMembershipNotification: async (input) => {
          events.push(input.event);
        },
      }
    );

    expect(events).toEqual([]);
  });
});
