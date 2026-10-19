'use client';

import { Mail, MonitorPlay, Phone, Tag, User, UserPlus, Users } from 'lucide-react';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { FormField } from '@/components/console/shared/form-field';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AvailableProfile } from '@/features/subscriptions/server/actions/create-subscription.action';
import type {
  SubscriptionCustomerOption,
  SubscriptionPlanOption,
} from '@/features/subscriptions/server/loaders/subscription-form.loader';
import type { SubscriptionFormValues } from '@/features/subscriptions/shared/subscription.schema';
import {
  customerLabel,
  planLabel,
  profileHint,
  profileLabel,
  profilePlaceholder,
} from '@/features/subscriptions/ui/components/new-subscription-form.helpers';
import {
  Section,
  SummaryRow,
} from '@/features/subscriptions/ui/components/new-subscription-form.sections';

type Ctl = Control<SubscriptionFormValues>;

export function CustomerSection({
  control,
  customerMode,
  customers,
}: {
  control: Ctl;
  customerMode: string;
  customers: SubscriptionCustomerOption[];
}) {
  return (
    <Section
      action={
        <Controller
          control={control}
          name="customerMode"
          render={({ field }) => (
            <div className="flex gap-1 rounded-lg border border-(--sm-border) p-1">
              <Button
                aria-pressed={field.value === 'existing'}
                disabled={customers.length === 0}
                onClick={() => field.onChange('existing')}
                size="sm"
                type="button"
                variant={field.value === 'existing' ? 'accent' : 'ghost'}
              >
                <Users className="size-4" />
                Existing
              </Button>
              <Button
                aria-pressed={field.value === 'new'}
                onClick={() => field.onChange('new')}
                size="sm"
                type="button"
                variant={field.value === 'new' ? 'accent' : 'ghost'}
              >
                <UserPlus className="size-4" />
                New
              </Button>
            </div>
          )}
        />
      }
      icon={<Users className="size-3.5" />}
      subtitle="Who the subscription is for"
      title="Customer"
    >
      {customerMode === 'existing' ? (
        <Controller
          control={control}
          name="customerId"
          render={({ field, fieldState }) => (
            <FormField error={fieldState.error?.message} label="Customer">
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger aria-label="Customer" className="w-full" icon={User}>
                  <SelectValue placeholder="Search customers…">
                    {customerLabel(customers, field.value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} · {customer.businessId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Controller
            control={control}
            name="newCustomerName"
            render={({ field, fieldState }) => (
              <FormField error={fieldState.error?.message} label="Full name">
                <Input
                  {...field}
                  error={fieldState.error?.message}
                  icon={User}
                  placeholder="Amina Benali"
                />
              </FormField>
            )}
          />
          <Controller
            control={control}
            name="newCustomerEmail"
            render={({ field, fieldState }) => (
              <FormField error={fieldState.error?.message} hint="Optional" label="E-mail">
                <Input
                  {...field}
                  error={fieldState.error?.message}
                  icon={Mail}
                  inputMode="email"
                  placeholder="amina@example.com"
                />
              </FormField>
            )}
          />
          <Controller
            control={control}
            name="newCustomerPhone"
            render={({ field, fieldState }) => (
              <FormField error={fieldState.error?.message} hint="Optional" label="Phone">
                <Input
                  {...field}
                  error={fieldState.error?.message}
                  icon={Phone}
                  inputMode="tel"
                  placeholder="+212 6 00 00 00 00"
                />
              </FormField>
            )}
          />
        </div>
      )}
    </Section>
  );
}

export function PlanSection({
  control,
  endDate,
  plans,
  selectedPlan,
}: {
  control: Ctl;
  endDate: string | null;
  plans: SubscriptionPlanOption[];
  selectedPlan: SubscriptionPlanOption | null;
}) {
  return (
    <Section icon={<Tag className="size-3.5" />} subtitle="Pricing and term" title="Plan">
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="planId"
          render={({ field, fieldState }) => (
            <FormField error={fieldState.error?.message} label="Plan">
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger aria-label="Plan" className="w-full" icon={Tag}>
                  <SelectValue placeholder="Pick a plan…">
                    {planLabel(plans, field.value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} · {plan.durationMonths} mo · {plan.price} {plan.currencyCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="startDate"
          render={({ field, fieldState }) => (
            <FormField error={fieldState.error?.message} label="Starts">
              <DatePicker
                ariaLabel="Start date"
                error={fieldState.error?.message}
                onChange={field.onChange}
                value={field.value}
              />
            </FormField>
          )}
        />
      </div>

      <SummaryRow endDate={endDate} plan={selectedPlan} />
    </Section>
  );
}

export function ProfileSection({
  control,
  isLoadingProfiles,
  profiles,
  selectedPlan,
}: {
  control: Ctl;
  isLoadingProfiles: boolean;
  profiles: AvailableProfile[];
  selectedPlan: SubscriptionPlanOption | null;
}) {
  return (
    <Section
      icon={<MonitorPlay className="size-3.5" />}
      subtitle="Optional — can be assigned later"
      title="Streaming profile"
    >
      <Controller
        control={control}
        name="profileKey"
        render={({ field }) => (
          <FormField
            hint={profileHint(selectedPlan, isLoadingProfiles, profiles.length)}
            label="Profile"
          >
            <Select
              disabled={selectedPlan === null || isLoadingProfiles || profiles.length === 0}
              onValueChange={field.onChange}
              value={field.value}
            >
              <SelectTrigger aria-label="Streaming profile" className="w-full" icon={MonitorPlay}>
                <SelectValue placeholder={profilePlaceholder(selectedPlan, isLoadingProfiles)}>
                  {profileLabel(profiles, field.value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem
                    key={profile.profileId}
                    value={`${profile.accountId}:${profile.profileId}`}
                  >
                    {profile.accountLabel} › {profile.profileName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      />
    </Section>
  );
}
