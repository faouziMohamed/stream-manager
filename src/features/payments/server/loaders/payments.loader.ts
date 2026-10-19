import { auth } from '@/lib/auth/auth';
import { gqlRequest } from '@/lib/graphql/client';
import { loadAllPages } from '@/lib/graphql/load-all-pages';
import {
  ListMembershipCustomerOptionsDocument,
  type ListMembershipCustomerOptionsQuery,
  type ListMembershipCustomerOptionsQueryVariables,
  ListMembershipsDocument,
  type ListMembershipsQuery,
  type ListMembershipsQueryVariables,
  ListPaymentsDocument,
  type ListPaymentsQuery,
  type ListPaymentsQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';

const log = createLogger('payments.loader');

type PaymentListItem = ListPaymentsQuery['payments']['items'][number];
type CustomerOption = ListMembershipCustomerOptionsQuery['customers']['items'][number];
type MembershipOption = ListMembershipsQuery['memberships']['items'][number];

export type PaymentCounts = {
  cancelled: number;
  overdue: number;
  paid: number;
  total: number;
  unpaid: number;
};

export type PaymentsPageInput = {
  /** `asc` walks a collection worklist oldest-first; `desc` is the default. */
  order?: 'asc' | 'desc';
  page: number;
  pageSize: number;
  /** `null` means every status; the chips count the whole set regardless. */
  status?: string | null;
};

export type PaymentsPagePayload = {
  counts: PaymentCounts;
  items: PaymentListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type PaymentListPayload = {
  cancelledCount: number;
  customerOptions: CustomerOption[];
  items: PaymentListItem[];
  membershipOptions: MembershipOption[];
  overdueCount: number;
  paidCount: number;
  total: number;
  unpaidCount: number;
};

/**
 * One page of the ledger, and the counts the filter chips need.
 *
 * The counts cannot come from the page — a page of paid rows says nothing
 * about how many are overdue — so each status is counted with its own
 * `pageSize: 1` query and only `pageInfo.total` is read. Six small queries
 * replace downloading every payment to count it in memory, which is what this
 * page did before.
 */
export async function loadPaymentsPage(input: PaymentsPageInput): Promise<PaymentsPagePayload> {
  const session = await auth();

  if (session === null || session.user?.id === undefined) {
    log.warn('No session or access token when loading a payments page');
    return {
      counts: EMPTY_COUNTS,
      items: [],
      page: 1,
      pageSize: input.pageSize,
      total: 0,
      totalPages: 0,
    };
  }

  const status = input.status ?? null;
  const count = (value: string | null) =>
    gqlRequest<ListPaymentsQuery, ListPaymentsQueryVariables>(ListPaymentsDocument, {
      dueFrom: null,
      dueTo: null,
      order: null,
      page: 1,
      pageSize: 1,
      status: value,
    }).then((response) => response.payments.pageInfo.total);

  const [page, all, unpaid, overdue, paid, cancelled] = await Promise.all([
    gqlRequest<ListPaymentsQuery, ListPaymentsQueryVariables>(ListPaymentsDocument, {
      dueFrom: null,
      dueTo: null,
      order: input.order ?? null,
      page: input.page,
      pageSize: input.pageSize,
      status,
    }),
    count(null),
    count('unpaid'),
    count('overdue'),
    count('paid'),
    count('cancelled'),
  ]);

  // A page can fall out of range between the click and the fetch — settling
  // the last row of page two shrinks the set to one page. Returning the empty
  // page would show "Page 2 of 1" and a table that looks broken, so the last
  // real page is fetched instead.
  if (page.payments.pageInfo.totalPages > 0 && input.page > page.payments.pageInfo.totalPages) {
    const lastPage = await gqlRequest<ListPaymentsQuery, ListPaymentsQueryVariables>(
      ListPaymentsDocument,
      {
        dueFrom: null,
        dueTo: null,
        order: input.order ?? null,
        page: page.payments.pageInfo.totalPages,
        pageSize: input.pageSize,
        status,
      }
    );

    return toPayload(lastPage.payments, { cancelled, overdue, paid, total: all, unpaid });
  }

  return toPayload(page.payments, { cancelled, overdue, paid, total: all, unpaid });
}

function toPayload(
  page: ListPaymentsQuery['payments'],
  counts: PaymentCounts
): PaymentsPagePayload {
  return {
    counts,
    items: page.items,
    page: page.pageInfo.page,
    pageSize: page.pageInfo.pageSize,
    total: page.pageInfo.total,
    totalPages: page.pageInfo.totalPages,
  };
}

const EMPTY_COUNTS: PaymentCounts = { cancelled: 0, overdue: 0, paid: 0, total: 0, unpaid: 0 };

export async function loadPayments(): Promise<PaymentListPayload> {
  const empty: PaymentListPayload = {
    cancelledCount: 0,
    customerOptions: [],
    items: [],
    membershipOptions: [],
    overdueCount: 0,
    paidCount: 0,
    total: 0,
    unpaidCount: 0,
  };

  try {
    const session = await auth();

    if (session === null || session.user?.id === undefined) {
      log.warn('No session or access token when loading payments');
      return empty;
    }

    const [payments, customers, memberships] = await Promise.all([
      loadAllPages(async (page, pageSize) => {
        const response = await gqlRequest<ListPaymentsQuery, ListPaymentsQueryVariables>(
          ListPaymentsDocument,
          { dueFrom: null, dueTo: null, order: null, page, pageSize, status: null }
        );
        return response.payments;
      }),
      loadAllPages(async (page, pageSize) => {
        const response = await gqlRequest<
          ListMembershipCustomerOptionsQuery,
          ListMembershipCustomerOptionsQueryVariables
        >(ListMembershipCustomerOptionsDocument, { page, pageSize });
        return response.customers;
      }),
      loadAllPages(async (page, pageSize) => {
        const response = await gqlRequest<ListMembershipsQuery, ListMembershipsQueryVariables>(
          ListMembershipsDocument,
          { page, pageSize, customerId: null }
        );
        return response.memberships;
      }),
    ]);

    return {
      cancelledCount: payments.items.filter((item) => item.status === 'cancelled').length,
      customerOptions: customers.items,
      items: payments.items,
      membershipOptions: memberships.items,
      overdueCount: payments.items.filter((item) => item.status === 'overdue').length,
      paidCount: payments.items.filter((item) => item.status === 'paid').length,
      total: payments.pageInfo.total,
      unpaidCount: payments.items.filter((item) => item.status === 'unpaid').length,
    };
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load payments'
    );
    throw error;
  }
}
