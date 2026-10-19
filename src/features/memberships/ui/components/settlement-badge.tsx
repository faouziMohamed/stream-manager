import type { ReactNode } from 'react';

import type { StatusTone } from '@/components/console/shared/status-badge';
import {
  getSettlementTone,
  type SettlementState,
} from '@/features/memberships/shared/membership-settlement';
import { cn } from '@/lib/utils';

/**
 * Whether the money came in — drawn hollow, so it cannot be mistaken for
 * whether the customer has access.
 *
 * Both facts want green: `ACTIVE` means they can watch, `PAID` means they
 * paid, and two identical filled pills beside each other read as one fact
 * printed twice. Colour keeps naming the state; the *form* now names the
 * dimension — filled is access, hollow is money. That holds for every pairing
 * the ledger can produce, not just the green one.
 */
export function SettlementBadge({
  children,
  state,
}: {
  children: ReactNode;
  state: SettlementState;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border bg-transparent px-2.5 py-0.5 text-[10px] font-semibold uppercase',
        TONE_CLASS[getSettlementTone(state)]
      )}
    >
      {children}
    </span>
  );
}

const TONE_CLASS: Record<StatusTone, string> = {
  caution: 'border-(--sm-gold) text-(--sm-gold-t)',
  critical: 'border-(--sm-coral) text-(--sm-coral-t)',
  neutral: 'border-(--sm-border2) text-(--sm-muted)',
  positive: 'border-(--sm-emerald) text-(--sm-emerald-t)',
};
