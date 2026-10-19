import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

export default function AuthStateCard({
  badge,
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryAction = {
    href: ROUTES.auth.login,
    label: 'Back to login',
  },
  details,
}: AuthStateCardProps) {
  const PrimaryIcon = primaryAction.icon;

  return (
    <Card className="border-(--sm-border) bg-[color-mix(in_oklab,var(--sm-surface)_92%,transparent)]">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant="outline"
            className="border-(--sm-border) bg-(--sm-surface2) text-(--sm-muted)"
          >
            {badge}
          </Badge>
          <div className="grid size-9 place-items-center rounded-xl border border-(--sm-border) bg-(--sm-surface2)">
            <Icon className="size-4 text-(--sm-gold)" />
          </div>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl leading-tight text-(--sm-fg)">{title}</CardTitle>
          <CardDescription className="text-(--sm-muted)">{description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Separator className="bg-(--sm-border)" />
        <div className="space-y-3">
          {details.map((detail) => (
            <p
              key={detail}
              className="rounded-xl border border-(--sm-border) bg-(--sm-surface2) px-4 py-3 text-sm leading-6 text-(--sm-muted)"
            >
              {detail}
            </p>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3 sm:flex-row">
        <Link
          className={cn(
            buttonVariants({ variant: 'default' }),
            'w-full gap-2 border-0 bg-(--sm-coral) text-(--sm-coral-fg) sm:flex-1'
          )}
          href={primaryAction.href}
        >
          <PrimaryIcon className="size-4" />
          {primaryAction.label}
        </Link>
        <Link
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'w-full border-(--sm-border) bg-(--sm-surface2) text-(--sm-fg) sm:flex-1'
          )}
          href={secondaryAction.href}
        >
          {secondaryAction.label}
        </Link>
      </CardFooter>
    </Card>
  );
}

type AuthStateCardProps = {
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  primaryAction: {
    href: string;
    label: string;
    icon: LucideIcon;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
  details: string[];
};
