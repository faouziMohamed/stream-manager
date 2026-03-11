// Subscriptions GraphQL operations
export const GET_SUBSCRIPTIONS = /* GraphQL */ `
  query GetSubscriptions($clientId: ID, $status: SubscriptionStatus) {
    subscriptions(clientId: $clientId, status: $status) {
      id clientId planId startDate endDate isRecurring status notes renewedFromId
      client { id name email phone }
      plan {
        id name durationMonths price currencyCode planType
        service { id name }
        promotion { id name }
      }
      createdAt updatedAt
    }
  }
`;

export const GET_SUBSCRIPTION = /* GraphQL */ `
  query GetSubscription($id: ID!) {
    subscription(id: $id) {
      id clientId planId startDate endDate isRecurring status notes renewedFromId
      client { id name email phone }
      plan {
        id name durationMonths price currencyCode planType
        service { id name }
        promotion { id name }
      }
      payments { id dueDate paidDate amount currencyCode status }
    }
  }
`;

export const CREATE_SUBSCRIPTION = /* GraphQL */ `
  mutation CreateSubscription($input: CreateSubscriptionInput!) {
    createSubscription(input: $input) {
      id clientId planId startDate endDate isRecurring status
    }
  }
`;

export const UPDATE_SUBSCRIPTION = /* GraphQL */ `
  mutation UpdateSubscription($id: ID!, $input: UpdateSubscriptionInput!) {
    updateSubscription(id: $id, input: $input) {
      id status startDate endDate isRecurring notes updatedAt
    }
  }
`;

export const DELETE_SUBSCRIPTION = /* GraphQL */ `
  mutation DeleteSubscription($id: ID!) {
    deleteSubscription(id: $id)
  }
`;

export const RENEW_SUBSCRIPTION = /* GraphQL */ `
  mutation RenewSubscription($input: RenewSubscriptionInput!) {
    renewSubscription(input: $input) {
      id clientId planId startDate endDate isRecurring status renewedFromId
    }
  }
`;

export type SubscriptionStatus = 'active' | 'expired' | 'paused' | 'cancelled';

export interface SubscriptionDto {
  id: string;
  clientId: string;
  planId: string;
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  status: SubscriptionStatus;
  notes: string | null;
  renewedFromId: string | null;
  client?: { id: string; name: string; email?: string | null; phone?: string | null };
  plan?: {
    id: string;
    name: string;
    durationMonths: number;
    price: number;
    currencyCode: string;
    planType: string;
    service?: { id: string; name: string } | null;
    promotion?: { id: string; name: string } | null;
  };
  payments?: Array<{ id: string; dueDate: string; paidDate: string | null; amount: number; currencyCode: string; status: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionInput {
  clientId: string;
  planId: string;
  startDate: string;
  isRecurring: boolean;
  notes?: string;
}

export interface UpdateSubscriptionInput {
  startDate?: string;
  isRecurring?: boolean;
  status?: SubscriptionStatus;
  notes?: string;
}

export interface RenewSubscriptionInput {
  subscriptionId: string;
  startDate: string;
  isRecurring: boolean;
  notes?: string;
}
