import {
  createPlanInputSchema,
  listPlansInputSchema,
} from '@/server/features/plans/schemas/validators/plans.validators';

describe('plan validators', () => {
  it('normalizes valid service-backed create input', () => {
    const result = createPlanInputSchema.parse({
      currencyCode: 'MAD',
      durationMonths: 1,
      name: '  Netflix Standard  ',
      planType: 'shared',
      price: '99.99',
      serviceId: 'svc_test',
    });

    expect(result).toEqual({
      currencyCode: 'MAD',
      durationMonths: 1,
      name: 'Netflix Standard',
      planType: 'shared',
      price: '99.99',
      serviceId: 'svc_test',
    });
  });

  it('rejects a create without a serviceId', () => {
    expect(() =>
      createPlanInputSchema.parse({
        durationMonths: 1,
        name: 'Netflix Standard',
        price: '99.99',
      })
    ).toThrow();
  });
});

describe('listPlansInputSchema', () => {
  it('coerces null filter args (unset GraphQL filters) to undefined', () => {
    const result = listPlansInputSchema.parse({
      isActive: null,
      planType: null,
      serviceId: null,
    });

    expect(result.planType).toBeUndefined();
    expect(result.serviceId).toBeUndefined();
    expect(result.isActive).toBeUndefined();
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it('accepts valid filter values', () => {
    const result = listPlansInputSchema.parse({ planType: 'shared', serviceId: 'svc_test' });

    expect(result.planType).toBe('shared');
    expect(result.serviceId).toBe('svc_test');
  });
});
