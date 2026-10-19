import { gqlRequest } from '@/lib/graphql/client';
import { createLogger } from '@/lib/logger';

export type AccountantMembershipItem = {
  id: string;
  businessId: string;
  customerName: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  isRecurring: boolean;
};

export type AccountantPaymentItem = {
  id: string;
  businessId: string;
  customerName: string;
  amount: string;
  currencyCode: string;
  status: string;
  dueDate: string;
  paidDate: string | null;
  method: string | null;
};

export type AccountantSummaryPayload = {
  memberships: AccountantMembershipItem[];
  payments: AccountantPaymentItem[];
};

export async function loadAccountantSummary(
  token: string
): Promise<AccountantSummaryPayload | null> {
  try {
    const data = await gqlRequest<AccountantSummaryResponse, { token: string }>(
      GET_ACCOUNTANT_SUMMARY,
      { token }
    );

    return data.summaryByToken;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load accountant summary'
    );
    return null;
  }
}

type AccountantSummaryResponse = {
  summaryByToken: AccountantSummaryPayload | null;
};

const log = createLogger('shared-summary.loader');

const GET_ACCOUNTANT_SUMMARY = /* GraphQL */ `
  query GetAccountantSummary($token: String!) {
    summaryByToken(token: $token) {
      memberships {
        id
        businessId
        customerName
        planName
        status
        startDate
        endDate
        isRecurring
      }
      payments {
        id
        businessId
        customerName
        amount
        currencyCode
        status
        dueDate
        paidDate
        method
      }
    }
  }
`;
