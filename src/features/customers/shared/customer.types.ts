import type { Customer, ListCustomersQuery } from '@/lib/graphql/generated/graphql';

export type CustomerDto = Customer;
export type CustomerListItem = ListCustomersQuery['customers']['items'][number];
export type CustomerConnection = {
  items: CustomerListItem[];
  pageInfo: ListCustomersQuery['customers']['pageInfo'];
};
export type CustomerDetailDto = Customer;

export type { PageInfo } from '@/lib/graphql/generated/graphql';
