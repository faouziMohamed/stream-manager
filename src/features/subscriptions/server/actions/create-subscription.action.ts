'use server';

import { requireSession } from '@/lib/auth/require-session';
import { gqlRequest } from '@/lib/graphql/client';
import {
  CreateSubscriptionDocument,
  type CreateSubscriptionMutation,
  type CreateSubscriptionMutationVariables,
  ListAvailableProfilesDocument,
  type ListAvailableProfilesQuery,
  type ListAvailableProfilesQueryVariables,
} from '@/lib/graphql/generated/graphql';
import { createLogger } from '@/lib/logger';
import { subscriptionFormSchema } from '@/features/subscriptions/shared/subscription.schema';
import type { SubscriptionFormValues } from '@/features/subscriptions/shared/subscription.schema';

const log = createLogger('create-subscription.action');

export type CreatedSubscription = CreateSubscriptionMutation['createSubscription'];
export type AvailableProfile = ListAvailableProfilesQuery['availableProfiles'][number];

export async function listAvailableProfilesAction(serviceId: string): Promise<AvailableProfile[]> {
  await requireSession('You must be signed in to create subscriptions');

  try {
    const data = await gqlRequest<ListAvailableProfilesQuery, ListAvailableProfilesQueryVariables>(
      ListAvailableProfilesDocument,
      { serviceId }
    );

    return data.availableProfiles;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error), serviceId },
      'Failed to load available profiles'
    );
    return [];
  }
}

/**
 * One action for the whole flow. The server re-validates the form rather than
 * trusting the client, then hands a single mutation to the API.
 */
export async function createSubscriptionAction(
  values: SubscriptionFormValues
): Promise<CreatedSubscription> {
  await requireSession('You must be signed in to create subscriptions');

  const parsed = subscriptionFormSchema.safeParse(values);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'The subscription details are invalid');
  }

  const form = parsed.data;
  const profile = parseProfileKey(form.profileKey);

  const data = await gqlRequest<CreateSubscriptionMutation, CreateSubscriptionMutationVariables>(
    CreateSubscriptionDocument,
    {
      input: {
        customerId: form.customerMode === 'existing' ? form.customerId : null,
        isRecurring: form.isRecurring,
        markPaid: form.markPaid,
        newCustomer:
          form.customerMode === 'new'
            ? {
                email: form.newCustomerEmail.length > 0 ? form.newCustomerEmail : null,
                name: form.newCustomerName,
                phone: form.newCustomerPhone.length > 0 ? form.newCustomerPhone : null,
              }
            : null,
        planId: form.planId,
        profile,
        startDate: form.startDate,
      },
    }
  );

  log.info(
    { reference: data.createSubscription.reference },
    'Subscription created through the guided flow'
  );

  return data.createSubscription;
}

/** The select carries "accountId:profileId" so one control picks both. */
function parseProfileKey(profileKey: string): { accountId: string; profileId: string } | null {
  if (profileKey.length === 0) {
    return null;
  }

  const [accountId, profileId] = profileKey.split(':');

  if (accountId === undefined || profileId === undefined) {
    return null;
  }

  return { accountId, profileId };
}
