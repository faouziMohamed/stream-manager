import Link from 'next/link';

import {
  BadgeCheck,
  Clock3,
  CreditCard,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

const operatorChecks = [
  'OAuth and credentials resolve into the same BFF session.',
  'Access requests stay separate from sign-in until signup exists.',
  'Recovery and approval states are ready for the next auth batch.',
] as const;

export default function AuthSidePanel() {
  return (
    <aside className="hidden border-r border-(--sm-border) bg-[linear-gradient(180deg,color-mix(in_oklab,var(--sm-surface)_82%,transparent),color-mix(in_oklab,var(--sm-surface2)_54%,transparent))] px-7 py-8 lg:block">
      <div className="flex h-full flex-col justify-between gap-8">
        <div className="space-y-7">
          <Badge
            variant="outline"
            className="border-(--sm-border) bg-(--sm-surface2) text-(--sm-muted)"
          >
            Premium operator entry
          </Badge>

          <div className="space-y-4">
            <h1 className="text-4xl leading-tight font-semibold text-(--sm-fg)">
              One controlled door into every streaming operation.
            </h1>
            <p className="text-sm leading-7 text-(--sm-muted)">
              Designed for operators who need secure access to customers, renewals, payments, and
              credentials without a marketing funnel getting in the way.
            </p>
          </div>

          <Separator className="bg-(--sm-border)" />

          <div className="grid gap-3">
            <AuthMetric
              icon={UsersRound}
              label="Customers"
              value="Profiles, ownership, renewal health"
            />
            <AuthMetric
              icon={CreditCard}
              label="Payments"
              value="Dues, overdue pressure, collection flow"
            />
            <AuthMetric
              icon={ShieldCheck}
              label="Credentials"
              value="Streaming accounts and profile assignments"
            />
          </div>

          <div className="space-y-3">
            {operatorChecks.map((item) => (
              <div key={item} className="flex gap-3 text-sm leading-6 text-(--sm-muted)">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-(--sm-emerald)" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-(--sm-border) bg-[color-mix(in_oklab,var(--sm-surface)_74%,transparent)]">
          <CardHeader>
            <div className="flex items-center gap-2 text-(--sm-gold)">
              <LockKeyhole className="size-4" />
              <CardTitle className="text-sm text-(--sm-fg)">Access lifecycle</CardTitle>
            </div>
            <CardDescription className="text-(--sm-muted)">
              These states are scaffolded now so later backend flows do not need a redesign.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <AuthStateLine icon={KeyRound} label="Password recovery" />
            <AuthStateLine icon={ShieldCheck} label="Email verification" />
            <AuthStateLine icon={Clock3} label="Approval pending" />
            <Link
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'mt-2 w-full border-(--sm-border) bg-(--sm-surface2) text-(--sm-fg)'
              )}
              href={ROUTES.auth.login}
            >
              Request access
            </Link>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}

type AuthMetricProps = {
  icon: typeof UsersRound;
  label: string;
  value: string;
};

function AuthMetric({ icon: Icon, label, value }: AuthMetricProps) {
  return (
    <div className="flex gap-3 rounded-xl border border-(--sm-border) bg-(--sm-surface2) p-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-(--sm-surface2)">
        <Icon className="size-4 text-(--sm-gold)" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-(--sm-fg)">{label}</p>
        <p className="mt-1 text-sm leading-5 text-(--sm-muted)">{value}</p>
      </div>
    </div>
  );
}

type AuthStateLineProps = {
  icon: typeof KeyRound;
  label: string;
};

function AuthStateLine({ icon: Icon, label }: AuthStateLineProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-(--sm-muted)">
      <Icon className="size-4 text-(--sm-emerald)" />
      <span>{label}</span>
    </div>
  );
}
