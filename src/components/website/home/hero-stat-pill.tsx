import type { ElementType } from 'react';
import { useCountUp } from '@/components/website/home/hero-use-count-up';

export type StatProps = {
  icon: ElementType;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  active: boolean;
  delay: number;
};

export function StatPill({
  icon: Icon,
  value,
  prefix = '',
  suffix = '',
  label,
  color,
  bg,
  border,
  active,
  delay,
}: StatProps) {
  const count = useCountUp(value, active, 1400);
  return (
    <div
      className="sm-reveal xs:gap-3 xs:rounded-2xl xs:px-4 xs:py-3 flex items-center gap-2 rounded-xl border px-2.5 py-2"
      style={{
        background: bg,
        borderColor: border,
        transitionDelay: `${delay}ms`,
      }}
    >
      <div
        className="xs:h-8 xs:w-8 xs:rounded-xl flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
        style={{ background: bg, border: `1px solid ${border}` }}
      >
        <Icon className="xs:h-4 xs:w-4 h-3 w-3" style={{ color }} />
      </div>
      <div>
        <p
          className="font-display xs:text-xl text-xs leading-none font-extrabold tabular-nums"
          style={{ color }}
        >
          {prefix}
          {count}
          {suffix}
        </p>
        <p className="xs:text-[11px] mt-0.5 text-[9px]" style={{ color: 'var(--sm-muted)' }}>
          {label}
        </p>
      </div>
    </div>
  );
}
