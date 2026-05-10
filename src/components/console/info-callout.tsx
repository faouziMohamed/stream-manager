'use client';

import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoCalloutProps {
  title?: string;
  children: ReactNode;
  variant?: 'tip' | 'info' | 'warning';
  className?: string;
}

const variantStyles = {
  tip: {
    container: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  info: {
    container: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950',
    icon: 'text-amber-600 dark:text-amber-400',
  },
};

export function InfoCallout({ title, children, variant = 'tip', className }: InfoCalloutProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 text-sm',
        'card-hover',
        styles.container,
        className
      )}
    >
      <Lightbulb className={cn('mt-0.5 h-5 w-5 shrink-0', styles.icon)} />
      <div className="space-y-1">
        {title && <p className="font-medium">{title}</p>}
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
