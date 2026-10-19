import { buildNotificationTemplate } from '@/server/features/notifications/templates/notifications.templates';

describe('buildNotificationTemplate', () => {
  it('says a renewal was a renewal, with the plan and the covered period', () => {
    const template = buildNotificationTemplate('MEMBERSHIP_RENEWED', {
      customerName: 'Hermann',
      endDate: '2026-12-09',
      membershipRef: 'MBR-2026-0016',
      planName: 'Basic',
      startDate: '2026-11-09',
    });

    expect(template.subject).toBe('Your membership has been renewed');
    expect(template.html).toContain('Hermann');
    expect(template.html).toContain('Basic');
    expect(template.html).toContain('2026-11-09 — 2026-12-09');
    expect(template.html).toContain('MBR-2026-0016');
  });

  it('carries the amount, the reference and the day a payment was received', () => {
    const template = buildNotificationTemplate('PAYMENT_RECEIVED', {
      amount: 'MAD 50.00',
      customerName: 'Hermann',
      paidDate: '2026-10-01',
      paymentRef: 'PAY-2026-0033',
    });

    expect(template.subject).toBe('Payment received');
    expect(template.html).toContain('MAD 50.00');
    expect(template.html).toContain('PAY-2026-0033');
    expect(template.html).toContain('2026-10-01');
  });

  it('still renders when a receipt has no amount to name', () => {
    const template = buildNotificationTemplate('PAYMENT_RECEIVED', {
      customerName: 'Hermann',
    });

    expect(template.html).toContain('payment has been received');
    expect(template.html).not.toContain('Amount:');
  });
});
