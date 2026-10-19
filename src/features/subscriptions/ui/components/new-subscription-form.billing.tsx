'use client';

import { BadgeCheck, Repeat } from 'lucide-react';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { SubscriptionFormValues } from '@/features/subscriptions/shared/subscription.schema';
import {
  Section,
  ToggleRow,
} from '@/features/subscriptions/ui/components/new-subscription-form.sections';

export function BillingSection({ control }: { control: Control<SubscriptionFormValues> }) {
  return (
    <Section
      icon={<BadgeCheck className="size-3.5" />}
      subtitle="How the first payment is recorded"
      title="Billing"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="markPaid"
          render={({ field }) => (
            <ToggleRow
              checked={field.value}
              description="Records the first payment as settled today."
              icon={<BadgeCheck className="size-4 text-(--sm-emerald)" />}
              label="Paid now"
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="isRecurring"
          render={({ field }) => (
            <ToggleRow
              checked={field.value}
              description="Renews automatically at the end of the term."
              icon={<Repeat className="size-4 text-(--sm-gold)" />}
              label="Recurring"
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
    </Section>
  );
}
