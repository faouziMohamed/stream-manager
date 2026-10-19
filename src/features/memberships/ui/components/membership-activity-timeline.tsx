'use client';

import { History } from 'lucide-react';
import { useState } from 'react';

import { ConsoleEmptyState } from '@/components/console/shared/console-empty-state';
import { Button } from '@/components/ui/button';
import type {
  MembershipActivityEvent,
  MembershipActivityKind,
} from '@/features/memberships/shared/membership-activity.mapper';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/iso-date';

const INITIAL_VISIBLE = 6;

/** The rail's dot colour, so the timeline reads at a glance without labels. */
const KIND_DOT: Record<MembershipActivityKind, string> = {
  cancelled: 'bg-(--sm-coral)',
  created: 'bg-(--sm-indigo)',
  paid: 'bg-(--sm-emerald)',
  payment: 'bg-(--sm-gold)',
  profile: 'bg-(--sm-violet)',
  renewed: 'bg-(--sm-emerald)',
};

/**
 * What happened to this subscription, newest first.
 *
 * A plain dated list rather than a feed with avatars and cards: the reader is
 * reconciling, and every line is a row from the database with its timestamp —
 * not a narrative someone wrote. Who did it is absent because nothing records
 * that, and an empty attribution would be a claim, not a gap.
 */
export function MembershipActivityTimeline({
  activities,
}: {
  activities: MembershipActivityEvent[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (activities.length === 0) {
    return (
      <ConsoleEmptyState
        description="Activity appears once this subscription has a payment or a renewal."
        title="Nothing has happened yet"
      />
    );
  }

  const visible = expanded ? activities : activities.slice(0, INITIAL_VISIBLE);
  const hidden = activities.length - visible.length;

  return (
    <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-6">
      <div className="mb-4 flex items-center gap-2">
        <History className="size-4 text-(--sm-coral)" />
        <h2 className="text-sm font-semibold text-(--sm-fg)">Activity ({activities.length})</h2>
      </div>

      <ol className="relative space-y-4 border-l border-(--sm-border) pl-5">
        {visible.map((event) => (
          <li className="relative" key={event.id}>
            <span
              className={cn(
                'absolute top-1.5 -left-[25px] size-2 rounded-full ring-2 ring-(--sm-surface)',
                KIND_DOT[event.kind]
              )}
            />
            <p className="text-sm font-medium text-(--sm-fg)">{event.title}</p>
            <p className="mt-0.5 text-xs text-(--sm-muted) tabular-nums">
              {formatDisplayDate(event.at.slice(0, 10)) || event.at} · {event.detail}
            </p>
          </li>
        ))}
      </ol>

      {hidden > 0 ? (
        <Button className="mt-4" onClick={() => setExpanded(true)} size="sm" variant="outline">
          Show {hidden} more
        </Button>
      ) : null}
    </section>
  );
}
