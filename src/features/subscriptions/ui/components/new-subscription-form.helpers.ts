import type { AvailableProfile } from '@/features/subscriptions/server/actions/create-subscription.action';
import type {
  SubscriptionCustomerOption,
  SubscriptionPlanOption,
} from '@/features/subscriptions/server/loaders/subscription-form.loader';

export function customerLabel(customers: SubscriptionCustomerOption[], id: string): string | null {
  const customer = customers.find((candidate) => candidate.id === id);
  return customer === undefined ? null : `${customer.name} · ${customer.businessId}`;
}

export function planLabel(plans: SubscriptionPlanOption[], id: string): string | null {
  const plan = plans.find((candidate) => candidate.id === id);

  if (plan === undefined) {
    return null;
  }

  return `${plan.name} · ${plan.durationMonths} mo · ${plan.price} ${plan.currencyCode}`;
}

export function profileLabel(profiles: AvailableProfile[], key: string): string | null {
  const profile = profiles.find(
    (candidate) => `${candidate.accountId}:${candidate.profileId}` === key
  );

  return profile === undefined ? null : `${profile.accountLabel} › ${profile.profileName}`;
}

export function profilePlaceholder(
  plan: SubscriptionPlanOption | null,
  isLoading: boolean
): string {
  if (plan === null) return 'Pick a plan first';
  if (isLoading) return 'Loading profiles…';

  return 'No profile';
}

export function profileHint(
  plan: SubscriptionPlanOption | null,
  isLoading: boolean,
  available: number
): string {
  if (plan === null) return 'Available profiles depend on the plan’s service.';
  if (isLoading) return 'Checking which profiles are free…';
  if (available === 0) return 'No free profile on this service — assign one later.';

  return `${available} free profile${available === 1 ? '' : 's'} on this service.`;
}

export function addMonths(dateValue: string, months: number): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return null;
  }

  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + months);

  return date.toISOString().slice(0, 10);
}
