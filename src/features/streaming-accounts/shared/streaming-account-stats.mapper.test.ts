import { buildStreamingAccountStats } from '@/features/streaming-accounts/shared/streaming-account-stats.mapper';

const TODAY = '2026-10-19';

function profile(id: string, membershipId: string | null = null) {
  return { assignmentId: membershipId === null ? null : `asg_${id}`, id, membershipId, name: id };
}

const memberships = new Map([
  [
    'mbr_a',
    {
      currencyCode: 'MAD',
      customerName: 'John Doe',
      endDate: '2026-12-17',
      monthlyPrice: 99,
      planName: 'Netflix Monthly',
      renewedFromId: null,
      startDate: '2026-11-17',
      status: 'active',
    },
  ],
  [
    'mbr_b',
    {
      currencyCode: 'MAD',
      customerName: 'Ayaldine Afretane',
      endDate: '2026-11-02',
      monthlyPrice: 49.5,
      planName: 'Netflix Yearly',
      renewedFromId: null,
      startDate: '2026-10-02',
      status: 'active',
    },
  ],
]);

describe('buildStreamingAccountStats', () => {
  it('splits capacity into what is sold and what is left', () => {
    const stats = buildStreamingAccountStats({
      maxProfiles: 5,
      membershipsById: memberships,
      profiles: [profile('p1', 'mbr_a'), profile('p2'), profile('p3')],
      today: TODAY,
    });

    expect(stats.capacity).toBe(3);
    expect(stats.assigned).toBe(1);
    expect(stats.free).toBe(2);
  });

  it('falls back to the allowed slots before any profile exists', () => {
    const stats = buildStreamingAccountStats({
      maxProfiles: 4,
      membershipsById: memberships,
      profiles: [],
      today: TODAY,
    });

    expect(stats.capacity).toBe(4);
    expect(stats.free).toBe(4);
  });

  it('counts only a holder whose cover is current', () => {
    // mbr_a starts in November, so the slot is sold but pays nothing yet.
    const stats = buildStreamingAccountStats({
      maxProfiles: 2,
      membershipsById: memberships,
      profiles: [profile('p1', 'mbr_a'), profile('p2', 'mbr_b')],
      today: TODAY,
    });

    expect(stats.monthlyRevenue).toBe(49.5);
    expect(stats.payingCount).toBe(1);
    expect(stats.currencyCode).toBe('MAD');
  });

  it('names the slot that frees up first among covered holders', () => {
    const stats = buildStreamingAccountStats({
      maxProfiles: 2,
      membershipsById: memberships,
      profiles: [profile('p1', 'mbr_a'), profile('p2', 'mbr_b')],
      today: TODAY,
    });

    expect(stats.nextToFree?.customerName).toBe('Ayaldine Afretane');
    expect(stats.nextToFree?.endDate).toBe('2026-11-02');
  });

  it('follows a renewal chain to the term that covers the holder now', () => {
    // The slot was created under a term that ended in June; the customer
    // renewed, and the newest term runs through December.
    const chained = new Map([
      [
        'mbr_old',
        {
          currencyCode: 'MAD',
          customerName: 'Hermann',
          endDate: '2026-06-09',
          monthlyPrice: 50,
          planName: 'Basic',
          renewedFromId: null,
          startDate: '2026-05-10',
          status: 'expired',
        },
      ],
      [
        'mbr_new',
        {
          currencyCode: 'MAD',
          customerName: 'Hermann',
          endDate: '2026-12-09',
          monthlyPrice: 50,
          planName: 'Basic',
          renewedFromId: 'mbr_old',
          startDate: '2026-11-09',
          status: 'expired',
        },
      ],
    ]);

    const stats = buildStreamingAccountStats({
      maxProfiles: 1,
      membershipsById: chained,
      profiles: [profile('p1', 'mbr_old')],
      today: TODAY,
    });

    // The slot is dated by the end of the chain, not by the term it was made
    // on, and the holder is covered through it.
    expect(stats.holders[0]?.membershipId).toBe('mbr_new');
    expect(stats.holders[0]?.phase).toBe('active');
    expect(stats.holders[0]?.endDate).toBe('2026-12-09');
  });

  it('keeps a recurring holder valid past its term and does not free the slot', () => {
    const lapsed = new Map([
      [
        'mbr_lapsed',
        {
          currencyCode: 'MAD',
          customerName: 'Hermann',
          endDate: '2026-10-13',
          isRecurring: true,
          monthlyPrice: 50,
          planName: 'Basic',
          renewedFromId: null,
          startDate: '2026-09-14',
          status: 'active',
        },
      ],
    ]);

    const stats = buildStreamingAccountStats({
      maxProfiles: 1,
      membershipsById: lapsed,
      profiles: [profile('p1', 'mbr_lapsed')],
      today: TODAY,
    });

    // The subscription is still valid — the renewal is unpaid, not cancelled
    // and not a freed slot.
    expect(stats.holders[0]?.phase).toBe('unpaid');
    expect(stats.payingCount).toBe(0);
    expect(stats.nextToFree).toBeNull();
    expect(stats.assigned).toBe(1);
  });

  it('frees a one-off slot on its end date', () => {
    const oneOff = new Map([
      [
        'mbr_one_off',
        {
          customerName: 'Farina',
          endDate: '2026-11-02',
          isRecurring: false,
          monthlyPrice: 50,
          renewedFromId: null,
          startDate: '2026-10-02',
          status: 'active',
        },
      ],
    ]);

    const stats = buildStreamingAccountStats({
      maxProfiles: 1,
      membershipsById: oneOff,
      profiles: [profile('p1', 'mbr_one_off')],
      today: TODAY,
    });

    expect(stats.nextToFree?.endDate).toBe('2026-11-02');
  });

  it('still counts a profile whose membership is no longer listed', () => {
    const stats = buildStreamingAccountStats({
      maxProfiles: 1,
      membershipsById: memberships,
      profiles: [profile('p1', 'mbr_gone')],
      today: TODAY,
    });

    expect(stats.assigned).toBe(1);
    expect(stats.free).toBe(0);
    expect(stats.holders[0]?.customerName).toBe('Unknown customer');
    expect(stats.monthlyRevenue).toBe(0);
    expect(stats.nextToFree).toBeNull();
  });

  it('reports an empty account without inventing a holder', () => {
    const stats = buildStreamingAccountStats({
      maxProfiles: 0,
      membershipsById: memberships,
      profiles: [],
      today: TODAY,
    });

    expect(stats).toMatchObject({ assigned: 0, capacity: 0, free: 0, monthlyRevenue: 0 });
    expect(stats.holders).toEqual([]);
    expect(stats.nextToFree).toBeNull();
  });
});
