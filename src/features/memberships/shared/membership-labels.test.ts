import { activeOnly, labelsById } from '@/features/memberships/shared/membership-labels';

const customers = [
  { id: 'cst_1', isActive: false, name: 'John Doe' },
  { id: 'cst_2', isActive: true, name: 'Ayaldine Afretane' },
];

describe('activeOnly', () => {
  it('keeps only the records an operator may still choose', () => {
    expect(activeOnly(customers).map((customer) => customer.id)).toEqual(['cst_2']);
  });

  it('returns nothing when the whole catalog is archived', () => {
    expect(activeOnly([{ id: 'cst_1', isActive: false, name: 'John Doe' }])).toEqual([]);
  });
});

describe('labelsById', () => {
  it('labels archived records too, because rows still point at them', () => {
    expect(labelsById(customers).get('cst_1')).toBe('John Doe');
  });

  it('labels active records', () => {
    expect(labelsById(customers).get('cst_2')).toBe('Ayaldine Afretane');
  });

  it('has no entry for an id that is not in the catalog', () => {
    expect(labelsById(customers).get('cst_missing')).toBeUndefined();
  });

  it('does not lose archived names when built from a filtered list', () => {
    // The regression: building labels from the picker list drops archived names.
    expect(labelsById(activeOnly(customers)).get('cst_1')).toBeUndefined();
    expect(labelsById(customers).get('cst_1')).toBe('John Doe');
  });
});
