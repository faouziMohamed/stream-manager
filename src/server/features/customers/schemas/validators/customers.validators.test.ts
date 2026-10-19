import {
  createCustomerInputSchema,
  updateCustomerInputSchema,
} from '@/server/features/customers/schemas/validators/customers.validators';

describe('customer validators', () => {
  it('normalizes valid create input', () => {
    const result = createCustomerInputSchema.parse({
      email: 'alice@example.com',
      name: '  Alice  ',
      phone: '  +212600000000  ',
    });

    expect(result).toEqual({
      email: 'alice@example.com',
      name: 'Alice',
      phone: '+212600000000',
    });
  });

  it('rejects an empty customer name', () => {
    expect(() =>
      createCustomerInputSchema.parse({
        name: '   ',
      })
    ).toThrow();
  });

  it('allows nullable optional fields on create input', () => {
    const result = createCustomerInputSchema.parse({
      email: null,
      name: 'Alice',
      notesContent: null,
      phone: null,
    });

    expect(result).toEqual({
      email: null,
      name: 'Alice',
      notesContent: null,
      phone: null,
    });
  });

  it('requires update input to include at least one editable field', () => {
    expect(() =>
      updateCustomerInputSchema.parse({
        id: 'cst_test',
      })
    ).toThrow();
  });
});
