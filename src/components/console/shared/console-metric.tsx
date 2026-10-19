import { cn } from '@/lib/utils';
import type { StatusTone } from '@/components/console/shared/status-badge';

const TONE_RULE: Record<StatusTone, string> = {
  caution: 'border-(--sm-gold)',
  critical: 'border-(--sm-coral)',
  neutral: 'border-(--sm-border2)',
  positive: 'border-(--sm-emerald)',
};

/**
 * A counted fact, written as a figure under its name.
 *
 * The left rule carries the same tone as the state it counts — emerald for
 * settled, gold for open, coral for overdue — so the row reads as a status
 * without an icon chip that repeats the label.
 */
export function ConsoleMetric({ description, label, tone = 'neutral', value }: ConsoleMetricProps) {
  return (
    <article className={cn('min-w-0 border-l-2 py-1 pl-4', TONE_RULE[tone])}>
      <p className="text-[11px] font-medium tracking-[0.1em] text-(--sm-muted) uppercase">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] text-(--sm-fg) tabular-nums">
        {value}
      </p>
      {description === undefined ? null : (
        <p className="mt-1 text-xs text-(--sm-muted)">{description}</p>
      )}
    </article>
  );
}

type ConsoleMetricProps = {
  description?: string;
  label: string;
  tone?: StatusTone;
  value: string;
};
