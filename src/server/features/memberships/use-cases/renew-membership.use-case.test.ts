import type { GqlContext } from '@/server/features/common/schemas/model/context.model';
import type { InsertMembershipWithPaymentInput } from '@/server/features/memberships/use-cases/membership-records.model';
import { renewMembershipUseCase } from '@/server/features/memberships/use-cases/renew-membership.use-case';

const adminContext: GqlContext = {
  isAccountant: false,
  isAdmin: true,
  sessionId: 'ses_admin',
  user: {
    avatar: null,
    email: 'admin@example.com',
    id: 'usr_admin',
    name: 'Admin',
    role: 'admin',
  },
};

function insertedTerms(terms: InsertMembershipWithPaymentInput[]) {
  return terms.map((term, index) => ({
    ...oldMembershipRecord,
    businessId: term.membership.businessId,
    endDate: term.membership.endDate,
    id: term.membership.id,
    payment: {
      ...paymentRecord,
      businessId: term.payment.businessId,
      dueDate: term.payment.dueDate,
      id: term.payment.id,
      paidDate: term.payment.paidDate ?? null,
      status: term.payment.status,
    },
    renewedFromId: term.membership.renewedFromId,
    startDate: term.membership.startDate,
    updatedAt: new Date(`2026-01-0${index + 1}T00:00:00.000Z`),
  }));
}

describe('renewMembershipUseCase', () => {
  it('creates a new membership from the old end date without changing the old row', async () => {
    const membership = await renewMembershipUseCase(
      { id: 'mbr_old', markPaid: false, terms: 1 },
      adminContext,
      {
        createMembershipId: () => 'mbr_new',
        createPaymentId: () => 'pay_new',
        findCustomerById: async () => null,
        findServiceById: async () => serviceRecord,
        findLatestMembershipBusinessId: async () => 'MBR-2026-0001',
        findLatestPaymentBusinessId: async () => 'PAY-2026-0001',
        findMembershipById: async () => oldMembershipRecord,
        findMembershipRenewedFrom: async () => null,
        findPlanById: async () => planRecord,
        insertMembershipTerms: async (terms) => insertedTerms(terms),
        today: () => '2026-06-01',
      }
    );

    expect(membership.id).toBe('mbr_new');
    expect(membership.businessId).toBe('MBR-2026-0002');
    expect(membership.renewedFromId).toBe('mbr_old');
    expect(membership.startDate).toBe('2026-06-11');
    expect(membership.endDate).toBe('2026-07-10');
  });

  it('chains several terms back to back and returns the last one', async () => {
    let captured: InsertMembershipWithPaymentInput[] = [];
    let created = 0;

    const membership = await renewMembershipUseCase(
      { id: 'mbr_old', markPaid: false, terms: 3 },
      adminContext,
      {
        createMembershipId: () => `mbr_new_${(created += 1)}`,
        createPaymentId: () => `pay_new_${created}`,
        findCustomerById: async () => null,
        findServiceById: async () => serviceRecord,
        findLatestMembershipBusinessId: async () => 'MBR-2026-0001',
        findLatestPaymentBusinessId: async () => 'PAY-2026-0001',
        findMembershipById: async () => oldMembershipRecord,
        findMembershipRenewedFrom: async () => null,
        findPlanById: async () => planRecord,
        insertMembershipTerms: async (terms) => {
          captured = terms;
          return insertedTerms(terms);
        },
        today: () => '2026-06-01',
      }
    );

    expect(captured).toHaveLength(3);
    expect(captured.map((term) => term.membership.startDate)).toEqual([
      '2026-06-11',
      '2026-07-11',
      '2026-08-11',
    ]);
    // Each term starts the day after the previous one ends: no overlap, no gap.
    // The end is the day before the same date next month, not that same date.
    expect(captured.map((term) => term.membership.endDate)).toEqual([
      '2026-07-10',
      '2026-08-10',
      '2026-09-10',
    ]);
    expect(captured.map((term) => term.membership.renewedFromId)).toEqual([
      'mbr_old',
      'mbr_new_1',
      'mbr_new_2',
    ]);
    expect(captured.map((term) => term.membership.businessId)).toEqual([
      'MBR-2026-0002',
      'MBR-2026-0003',
      'MBR-2026-0004',
    ]);
    expect(membership.endDate).toBe('2026-09-10');
  });

  it('emails a renewal notice rather than a first-time confirmation', async () => {
    const sent: { event: string; subject: string }[] = [];

    await renewMembershipUseCase({ id: 'mbr_old', markPaid: false, terms: 1 }, adminContext, {
      createMembershipId: () => 'mbr_new',
      createPaymentId: () => 'pay_new',
      findCustomerById: async () => ({
        businessId: 'CST-0001',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        email: 'hermann@example.com',
        id: 'cst_test',
        isActive: true,
        name: 'Hermann',
        notesContent: null,
        phone: null,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
      findLatestMembershipBusinessId: async () => 'MBR-2026-0001',
      findLatestPaymentBusinessId: async () => 'PAY-2026-0001',
      findMembershipById: async () => oldMembershipRecord,
      findMembershipRenewedFrom: async () => null,
      findPlanById: async () => planRecord,
      findServiceById: async () => serviceRecord,
      insertMembershipTerms: async (terms) => insertedTerms(terms),
      sendMembershipNotification: async (input) => {
        sent.push(input);
      },
      today: () => '2026-06-01',
    });

    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]?.event).toBe('MEMBERSHIP_RENEWED');
    expect(sent[0]?.subject).toBe('Your membership has been renewed');
  });

  it('settles every payment it creates when the money was taken up front', async () => {
    let captured: InsertMembershipWithPaymentInput[] = [];
    let created = 0;

    await renewMembershipUseCase({ id: 'mbr_old', markPaid: true, terms: 2 }, adminContext, {
      createMembershipId: () => `mbr_new_${(created += 1)}`,
      createPaymentId: () => `pay_new_${created}`,
      findCustomerById: async () => null,
      findServiceById: async () => serviceRecord,
      findLatestMembershipBusinessId: async () => 'MBR-2026-0001',
      findLatestPaymentBusinessId: async () => 'PAY-2026-0001',
      findMembershipById: async () => oldMembershipRecord,
      findMembershipRenewedFrom: async () => null,
      findPlanById: async () => planRecord,
      insertMembershipTerms: async (terms) => {
        captured = terms;
        return insertedTerms(terms);
      },
      today: () => '2026-06-01',
    });

    expect(captured.map((term) => term.payment.status)).toEqual(['paid', 'paid']);
    expect(captured.map((term) => term.payment.paidDate)).toEqual(['2026-06-01', '2026-06-01']);
  });

  it('stamps the day the money was taken, not the day it was recorded', async () => {
    let captured: InsertMembershipWithPaymentInput[] = [];

    await renewMembershipUseCase(
      { id: 'mbr_old', markPaid: true, paidDate: '2026-05-28', terms: 1 },
      adminContext,
      {
        createMembershipId: () => 'mbr_new',
        createPaymentId: () => 'pay_new',
        findCustomerById: async () => null,
        findServiceById: async () => serviceRecord,
        findLatestMembershipBusinessId: async () => 'MBR-2026-0001',
        findLatestPaymentBusinessId: async () => 'PAY-2026-0001',
        findMembershipById: async () => oldMembershipRecord,
        findMembershipRenewedFrom: async () => null,
        findPlanById: async () => planRecord,
        insertMembershipTerms: async (terms) => {
          captured = terms;
          return insertedTerms(terms);
        },
        today: () => '2026-06-01',
      }
    );

    expect(captured[0]?.payment.status).toBe('paid');
    expect(captured[0]?.payment.paidDate).toBe('2026-05-28');
  });

  it('leaves payments unpaid when the money has not been taken', async () => {
    let captured: InsertMembershipWithPaymentInput[] = [];

    await renewMembershipUseCase({ id: 'mbr_old', markPaid: false, terms: 1 }, adminContext, {
      createMembershipId: () => 'mbr_new',
      createPaymentId: () => 'pay_new',
      findCustomerById: async () => null,
      findServiceById: async () => serviceRecord,
      findLatestMembershipBusinessId: async () => 'MBR-2026-0001',
      findLatestPaymentBusinessId: async () => 'PAY-2026-0001',
      findMembershipById: async () => oldMembershipRecord,
      findMembershipRenewedFrom: async () => null,
      findPlanById: async () => planRecord,
      insertMembershipTerms: async (terms) => {
        captured = terms;
        return insertedTerms(terms);
      },
      today: () => '2026-06-01',
    });

    expect(captured[0]?.payment.status).toBe('unpaid');
    expect(captured[0]?.payment.paidDate).toBeNull();
  });

  it('refuses to renew a term that already has a successor', async () => {
    await expect(
      renewMembershipUseCase({ id: 'mbr_old', markPaid: false, terms: 1 }, adminContext, {
        createMembershipId: () => 'mbr_new',
        createPaymentId: () => 'pay_new',
        findCustomerById: async () => null,
        findServiceById: async () => serviceRecord,
        findLatestMembershipBusinessId: async () => 'MBR-2026-0001',
        findLatestPaymentBusinessId: async () => 'PAY-2026-0001',
        findMembershipById: async () => oldMembershipRecord,
        findMembershipRenewedFrom: async () => ({ businessId: 'MBR-2026-0002', id: 'mbr_next' }),
        findPlanById: async () => planRecord,
        insertMembershipTerms: async () => null,
        today: () => '2026-01-01',
      })
    ).rejects.toThrow(/already renewed|renewed as MBR-2026-0002/i);
  });

  it('retries with next membership/payment business ids on unique violation', async () => {
    let attempts = 0;
    const attemptedBusinessIds: Array<{
      membershipBusinessId: string;
      paymentBusinessId: string;
    }> = [];

    const membership = await renewMembershipUseCase(
      { id: 'mbr_old', markPaid: false, terms: 1 },
      adminContext,
      {
        createMembershipId: () => 'mbr_new',
        createPaymentId: () => 'pay_new',
        findCustomerById: async () => null,
        findServiceById: async () => serviceRecord,
        findLatestMembershipBusinessId: async () => 'MBR-2026-0001',
        findLatestPaymentBusinessId: async () => 'PAY-2026-0001',
        findMembershipById: async () => oldMembershipRecord,
        findMembershipRenewedFrom: async () => null,
        findPlanById: async () => planRecord,
        insertMembershipTerms: async (terms) => {
          attempts += 1;
          attemptedBusinessIds.push({
            membershipBusinessId: terms[0]?.membership.businessId ?? '',
            paymentBusinessId: terms[0]?.payment.businessId ?? '',
          });

          if (attempts === 1) {
            throw { code: '23505' };
          }

          return insertedTerms(terms);
        },
        today: () => '2026-06-01',
      }
    );

    expect(attempts).toBe(2);
    expect(attemptedBusinessIds).toEqual([
      {
        membershipBusinessId: 'MBR-2026-0002',
        paymentBusinessId: 'PAY-2026-0002',
      },
      {
        membershipBusinessId: 'MBR-2026-0003',
        paymentBusinessId: 'PAY-2026-0003',
      },
    ]);
    expect(membership.businessId).toBe('MBR-2026-0003');
    expect(membership.payment.businessId).toBe('PAY-2026-0003');
  });
});

const oldMembershipRecord = {
  businessId: 'MBR-2026-0001',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  customerId: 'cst_test',
  endDate: '2026-06-10',
  id: 'mbr_old',
  isRecurring: true,
  planId: 'pln_test',
  renewedFromId: null,
  startDate: '2026-05-10',
  status: 'active' as const,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const planRecord = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  currencyCode: 'MAD',
  durationMonths: 1,
  id: 'pln_test',
  isActive: true,
  name: 'Netflix Standard',
  planType: 'shared' as const,
  price: '99.99',
  serviceId: 'svc_test',
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const serviceRecord = {
  category: 'video' as const,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  descriptionContent: null,
  id: 'svc_test',
  imageKey: null,
  isActive: true,
  name: 'Netflix',
  supportsProfiles: true,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const paymentRecord = {
  amount: '99.99',
  businessId: 'PAY-2026-0002',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  currencyCode: 'MAD',
  customerId: 'cst_test',
  dueDate: '2026-06-11',
  id: 'pay_new',
  membershipId: 'mbr_new',
  method: null,
  notes: null,
  paidDate: null,
  status: 'unpaid' as const,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
