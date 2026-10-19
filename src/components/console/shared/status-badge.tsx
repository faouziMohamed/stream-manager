import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type StatusTone = 'positive' | 'caution' | 'critical' | 'neutral';

export function StatusBadge({ children, className, tone }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase',
        TONE_CLASS[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// `-t` tones, not the brand tones: each is measured at >= 4.5:1 against its
// own composed fill in both themes. The brand tones failed that on the badge.
const TONE_CLASS: Record<StatusTone, string> = {
  caution: 'border-(--sm-gold-b) bg-(--sm-gold-s) text-(--sm-gold-t)',
  critical: 'border-(--sm-coral-b) bg-(--sm-coral-s) text-(--sm-coral-t)',
  neutral: 'border-(--sm-border) bg-(--sm-surface2) text-(--sm-muted)',
  positive: 'border-(--sm-emerald-b) bg-(--sm-emerald-s) text-(--sm-emerald-t)',
};

type StatusBadgeProps = {
  children: ReactNode;
  className?: string;
  tone: StatusTone;
};
