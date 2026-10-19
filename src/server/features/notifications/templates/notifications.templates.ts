import { renderTipTapToHtml } from '@/server/common/utils/tiptap-html.renderer';

export function buildNotificationTemplate(
  event: string,
  input: BuildNotificationTemplateInput
): { html: string; subject: string } {
  const richContent = input.content === undefined ? '' : renderTipTapToHtml(input.content);

  switch (event) {
    case 'MEMBERSHIP_CREATED': {
      const body = [
        `<p>Hello ${input.customerName ?? 'there'},</p>`,
        `<p>Your membership has been created successfully.</p>`,
        input.planName ? `<p><strong>Plan:</strong> ${input.planName}</p>` : '',
        input.startDate && input.endDate
          ? `<p><strong>Period:</strong> ${input.startDate} — ${input.endDate}</p>`
          : '',
        input.membershipRef ? `<p><strong>Reference:</strong> ${input.membershipRef}</p>` : '',
      ]
        .filter(Boolean)
        .join('\n');
      return build('Your membership is confirmed', body);
    }
    case 'MEMBERSHIP_RENEWED': {
      const body = [
        `<p>Hello ${input.customerName ?? 'there'},</p>`,
        `<p>Your membership has been renewed.</p>`,
        input.planName ? `<p><strong>Plan:</strong> ${input.planName}</p>` : '',
        input.startDate && input.endDate
          ? `<p><strong>Covered period:</strong> ${input.startDate} — ${input.endDate}</p>`
          : '',
        input.membershipRef ? `<p><strong>Reference:</strong> ${input.membershipRef}</p>` : '',
      ]
        .filter(Boolean)
        .join('\n');
      return build('Your membership has been renewed', body);
    }
    case 'PAYMENT_OVERDUE': {
      const body = [
        `<p>Hello ${input.customerName ?? 'there'},</p>`,
        `<p>A payment for your membership is overdue.</p>`,
        input.dueDate ? `<p><strong>Due date:</strong> ${input.dueDate}</p>` : '',
        input.membershipRef ? `<p><strong>Membership:</strong> ${input.membershipRef}</p>` : '',
        `<p>Please settle this payment as soon as possible.</p>`,
      ]
        .filter(Boolean)
        .join('\n');
      return build('Payment overdue — action required', body);
    }
    case 'PAYMENT_RECEIVED': {
      const amountLine =
        input.amount === undefined
          ? ''
          : `<p><strong>Amount:</strong> ${input.amount}${input.currencyCode === undefined ? '' : ` ${input.currencyCode}`}</p>`;
      const body = [
        `<p>Hello ${input.customerName ?? 'there'},</p>`,
        `<p>Your payment has been received. Thank you!</p>`,
        amountLine,
        input.paymentRef ? `<p><strong>Reference:</strong> ${input.paymentRef}</p>` : '',
        input.paidDate ? `<p><strong>Paid on:</strong> ${input.paidDate}</p>` : '',
        input.membershipRef ? `<p><strong>Membership:</strong> ${input.membershipRef}</p>` : '',
      ]
        .filter(Boolean)
        .join('\n');
      return build('Payment received', body);
    }
    case 'MEMBERSHIP_EXPIRING': {
      const body = [
        `<p>Hello ${input.customerName ?? 'there'},</p>`,
        `<p>Your membership will expire soon.</p>`,
        input.endDate ? `<p><strong>Expiry date:</strong> ${input.endDate}</p>` : '',
        input.membershipRef ? `<p><strong>Reference:</strong> ${input.membershipRef}</p>` : '',
        `<p>Contact us if you would like to renew.</p>`,
      ]
        .filter(Boolean)
        .join('\n');
      return build('Your membership is expiring soon', body);
    }
    case 'MEMBERSHIP_EXPIRED': {
      const body = [
        `<p>Hello ${input.customerName ?? 'there'},</p>`,
        `<p>Your membership has expired.</p>`,
        input.membershipRef ? `<p><strong>Reference:</strong> ${input.membershipRef}</p>` : '',
        `<p>Contact us if you would like to renew your subscription.</p>`,
      ]
        .filter(Boolean)
        .join('\n');
      return build('Your membership has expired', body);
    }
    default: {
      return build('Notification StreamManager', richContent || '<p>Notification</p>');
    }
  }
}

function build(subject: string, body: string): { html: string; subject: string } {
  return {
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">${body}</div>`,
    subject,
  };
}

export interface BuildNotificationTemplateInput {
  /** Already formatted, e.g. `MAD 50.00`. */
  amount?: string;
  content?: unknown;
  currencyCode?: string;
  customerName?: string;
  dueDate?: string;
  endDate?: string;
  membershipRef?: string;
  paidDate?: string;
  paymentRef?: string;
  planName?: string;
  startDate?: string;
}
