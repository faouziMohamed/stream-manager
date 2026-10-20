import { notifyAdmins } from '@/server/features/notifications/service/notify-admins.service';

describe('notifyAdmins', () => {
  it('sends one copy to every administrator', async () => {
    const sent: string[] = [];

    await notifyAdmins(
      { event: 'ADMIN_PAYMENT_RECEIVED', html: '<p>paid</p>', subject: 'Payment received' },
      {
        findAdminEmails: async () => ['one@example.com', 'two@example.com'],
        send: async (input) => {
          sent.push(input.to);
        },
      }
    );

    expect(sent).toEqual(['one@example.com', 'two@example.com']);
  });

  it('keeps delivering when one address fails', async () => {
    const sent: string[] = [];

    await notifyAdmins(
      { event: 'ADMIN_PAYMENT_RECEIVED', html: '<p>paid</p>', subject: 'Payment received' },
      {
        findAdminEmails: async () => ['broken@example.com', 'ok@example.com'],
        send: async (input) => {
          if (input.to === 'broken@example.com') throw new Error('rejected');
          sent.push(input.to);
        },
      }
    );

    expect(sent).toEqual(['ok@example.com']);
  });

  it('does nothing when there is no administrator', async () => {
    const send = vi.fn();

    await notifyAdmins(
      { event: 'ADMIN_PAYMENT_RECEIVED', html: '<p>paid</p>', subject: 'Payment received' },
      { findAdminEmails: async () => [], send }
    );

    expect(send).not.toHaveBeenCalled();
  });
});
