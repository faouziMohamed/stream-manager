'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { PrerequisiteOverlay } from '@/components/console/shared/prerequisite-overlay';
import { Button } from '@/components/ui/button';

import {
  createSubscriptionAction,
  listAvailableProfilesAction,
} from '@/features/subscriptions/server/actions/create-subscription.action';
import type { AvailableProfile } from '@/features/subscriptions/server/actions/create-subscription.action';
import type {
  SubscriptionCustomerOption,
  SubscriptionPlanOption,
} from '@/features/subscriptions/server/loaders/subscription-form.loader';
import { subscriptionFormSchema } from '@/features/subscriptions/shared/subscription.schema';
import type { SubscriptionFormValues } from '@/features/subscriptions/shared/subscription.schema';

import { addTermMonths, formatDisplayDate, formatIsoDate } from '@/lib/utils/iso-date';
import { BillingSection } from '@/features/subscriptions/ui/components/new-subscription-form.billing';
import {
  CustomerSection,
  PlanSection,
  ProfileSection,
} from '@/features/subscriptions/ui/components/new-subscription-form.fields';
import { ROUTES } from '@/lib/config/routes';
import { clientLogger } from '@/lib/logger/client-logger';

const log = clientLogger('new-subscription-form');

type NewSubscriptionFormProps = {
  customers: SubscriptionCustomerOption[];
  plans: SubscriptionPlanOption[];
};

export function NewSubscriptionForm({ customers, plans }: NewSubscriptionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [profiles, setProfiles] = useState<AvailableProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  const { control, handleSubmit, setValue, watch } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      customerId: '',
      customerMode: customers.length > 0 ? 'existing' : 'new',
      isRecurring: false,
      markPaid: true,
      newCustomerEmail: '',
      newCustomerName: '',
      newCustomerPhone: '',
      planId: '',
      profileKey: '',
      startDate: formatIsoDate(new Date()),
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form's watch() cannot be memoized by the React Compiler.
  const customerMode = watch('customerMode');
  const planId = watch('planId');
  const startDate = watch('startDate');

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === planId) ?? null,
    [planId, plans]
  );

  const endDate = useMemo(
    () => (selectedPlan === null ? null : addTermMonths(startDate, selectedPlan.durationMonths)),
    [selectedPlan, startDate]
  );

  // Profiles depend on the plan's service, so they reload whenever the plan
  // changes. A previously picked profile is cleared because it may belong to
  // a different service.
  useEffect(() => {
    if (selectedPlan === null) {
      setProfiles([]);
      return;
    }

    let cancelled = false;
    setIsLoadingProfiles(true);
    setValue('profileKey', '');

    listAvailableProfilesAction(selectedPlan.serviceId)
      .then((result) => {
        if (!cancelled) setProfiles(result);
      })
      .catch((error: unknown) => {
        log.error('Failed to load available profiles', error);
        if (!cancelled) setProfiles([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProfiles(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPlan, setValue]);

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      try {
        const created = await createSubscriptionAction(values);
        toast.success(`Subscription ${created.reference} created`, {
          description: `${formatDisplayDate(created.startDate)} → ${formatDisplayDate(created.endDate)}`,
        });
        router.push(ROUTES.console.customerDetail(created.customerId));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'The subscription could not be created';
        log.error('Create subscription failed', error);
        toast.error(message);
      }
    });
  });

  return (
    <form className="relative space-y-5" onSubmit={onSubmit}>
      {plans.length === 0 ? (
        <PrerequisiteOverlay
          description="A subscription takes its price and term from a plan."
          requirements={[{ href: ROUTES.console.plans, label: 'Create a plan first' }]}
          title="No plans yet"
        />
      ) : null}

      <CustomerSection control={control} customerMode={customerMode} customers={customers} />

      <PlanSection control={control} endDate={endDate} plans={plans} selectedPlan={selectedPlan} />

      <ProfileSection
        control={control}
        isLoadingProfiles={isLoadingProfiles}
        profiles={profiles}
        selectedPlan={selectedPlan}
      />

      <BillingSection control={control} />

      <div className="flex justify-end">
        <Button disabled={isPending || plans.length === 0} type="submit" variant="accent">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Create subscription
        </Button>
      </div>
    </form>
  );
}
