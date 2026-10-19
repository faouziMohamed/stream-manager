import {
  cancelMembershipInputSchema,
  createMembershipInputSchema,
  membershipFiltersSchema,
  renewMembershipInputSchema,
} from '@/server/features/memberships/schemas/validators/memberships.validators';

describe('createMembershipInputSchema', () => {
  it('accepts valid input', () => {
    const result = createMembershipInputSchema.parse({
      customerId: 'cst_test',
      planId: 'pln_test',
      startDate: '2026-01-15',
    });

    expect(result).toEqual({
      allowExpiredPromotion: undefined,
      customerId: 'cst_test',
      isRecurring: false,
      planId: 'pln_test',
      startDate: '2026-01-15',
    });
  });

  it('defaults isRecurring to false when omitted', () => {
    const result = createMembershipInputSchema.parse({
      customerId: 'cst_test',
      planId: 'pln_test',
      startDate: '2026-01-15',
    });

    expect(result.isRecurring).toBe(false);
  });

  it('accepts isRecurring set to true', () => {
    const result = createMembershipInputSchema.parse({
      customerId: 'cst_test',
      isRecurring: true,
      planId: 'pln_test',
      startDate: '2026-01-15',
    });

    expect(result.isRecurring).toBe(true);
  });

  it('rejects invalid date format', () => {
    expect(() =>
      createMembershipInputSchema.parse({
        customerId: 'cst_test',
        planId: 'pln_test',
        startDate: '15-01-2026',
      })
    ).toThrow();
  });

  it('rejects missing customerId', () => {
    expect(() =>
      createMembershipInputSchema.parse({
        planId: 'pln_test',
        startDate: '2026-01-15',
      })
    ).toThrow();
  });
});

describe('renewMembershipInputSchema', () => {
  it('defaults to one unpaid term', () => {
    expect(renewMembershipInputSchema.parse({ id: 'mbr_test' })).toEqual({
      id: 'mbr_test',
      markPaid: false,
      terms: 1,
    });
  });

  it('accepts a multi-term paid renewal and GraphQL nulls', () => {
    expect(
      renewMembershipInputSchema.parse({ id: 'mbr_test', markPaid: true, terms: 3 })
    ).toMatchObject({ markPaid: true, terms: 3 });

    // GraphQL sends `null` for omitted nullable input fields.
    expect(
      renewMembershipInputSchema.parse({ id: 'mbr_test', markPaid: null, terms: null })
    ).toMatchObject({ markPaid: false, terms: 1 });
  });

  it('rejects a term count outside 1–12 and a non-integer', () => {
    expect(() => renewMembershipInputSchema.parse({ id: 'mbr_test', terms: 0 })).toThrow();
    expect(() => renewMembershipInputSchema.parse({ id: 'mbr_test', terms: 13 })).toThrow();
    expect(() => renewMembershipInputSchema.parse({ id: 'mbr_test', terms: 1.5 })).toThrow();
  });

  it('rejects missing id', () => {
    expect(() => renewMembershipInputSchema.parse({})).toThrow();
  });
});

describe('cancelMembershipInputSchema', () => {
  it('accepts valid input', () => {
    const result = cancelMembershipInputSchema.parse({
      confirmed: true,
      id: 'mbr_test',
    });

    expect(result).toEqual({
      confirmed: true,
      id: 'mbr_test',
    });
  });

  it('rejects missing confirmed', () => {
    expect(() =>
      cancelMembershipInputSchema.parse({
        id: 'mbr_test',
      })
    ).toThrow();
  });
});

describe('membershipFiltersSchema', () => {
  it('applies pagination defaults', () => {
    const result = membershipFiltersSchema.parse({});

    expect(result).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('accepts valid filters', () => {
    const result = membershipFiltersSchema.parse({
      customerId: 'cst_test',
      page: 2,
      pageSize: 10,
      serviceId: 'svc_test',
      status: 'active',
    });

    expect(result).toEqual({
      customerId: 'cst_test',
      page: 2,
      pageSize: 10,
      serviceId: 'svc_test',
      status: 'active',
    });
  });

  it('coerces null filter args (unset GraphQL filters) to undefined', () => {
    const result = membershipFiltersSchema.parse({
      customerId: null,
      serviceId: null,
      status: null,
    });

    expect(result.customerId).toBeUndefined();
    expect(result.serviceId).toBeUndefined();
    expect(result.status).toBeUndefined();
    expect(result.page).toBe(1);
  });

  it('rejects invalid status', () => {
    expect(() =>
      membershipFiltersSchema.parse({
        status: 'invalid',
      })
    ).toThrow();
  });

  it('rejects negative page', () => {
    expect(() =>
      membershipFiltersSchema.parse({
        page: -1,
      })
    ).toThrow();
  });

  it('rejects pageSize over 100', () => {
    expect(() =>
      membershipFiltersSchema.parse({
        pageSize: 200,
      })
    ).toThrow();
  });
});
